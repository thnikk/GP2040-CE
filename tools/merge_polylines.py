#!/usr/bin/env python3
"""Merge connected SVG elements (polylines, lines, arcs, curves) into closed shapes.

Usage: python3 merge_polylines.py input.svg [output.svg]

Collects ALL <polyline> and <path> elements, finds connected components
(sharing endpoints), and merges each component into a single <path> element.

Handles ALL SVG path commands: M, L, H, V, C, S, Q, T, A, Z (absolute and
relative).  Curve/arc commands are preserved verbatim in the output —
only the initial M/m is stripped when concatenating segments.

Two SVG layouts supported:
  - Polylines/paths as direct children of <svg>
  - Polylines/paths inside <g> elements (attributes inherited from group)
"""

import re
import xml.etree.ElementTree as ET
import sys

SVG_NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG_NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

TOLERANCE = 0.5

PATH_KEEP = {
    'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
    'stroke-opacity', 'stroke-dasharray', 'stroke-miterlimit',
    'fill-opacity', 'fill-rule', 'transform', 'd',
}


def tag(name):
    return f'{{{SVG_NS}}}{name}'


# ---- Path tokeniser ------------------------------------------------------

def tokenize_path(d):
    """Split SVG path d-string into a list of command letters and numbers."""
    tokens = []
    buf = ''
    for ch in d:
        if ch in 'MLHVZCmlhvzc' or ch in 'CSQTAcsqta':
            if buf:
                tokens.append(buf)
                buf = ''
            tokens.append(ch)
        elif ch in ' \t\n\r,':
            if buf:
                tokens.append(buf)
                buf = ''
        elif ch == '-':
            if buf:
                tokens.append(buf)
                buf = ''
            buf = '-'
        elif ch in '0123456789.':
            buf += ch
        elif ch in 'eE':
            buf += ch
    if buf:
        tokens.append(buf)
    return tokens


# ---- Start / end extractor -----------------------------------------------

def path_endpoints(d):
    """Return (start, end) for any SVG path d-string.

    Walks all command types to track the absolute cursor position.
    start is (x, y) or None; end is (x, y).
    """
    tokens = tokenize_path(d)
    cx = cy = 0.0
    sx = sy = None
    first = None
    i = 0

    while i < len(tokens):
        t = tokens[i]

        if t not in 'MLHVZCmlhvz' and t not in 'CSQTAcsqta':
            i += 1
            continue
        cmd = t
        i += 1

        if cmd in 'Zz':
            if sx is not None:
                cx, cy = sx, sy
            continue

        args = []
        while i < len(tokens) and tokens[i] not in 'MLHVZCmlhvz' and tokens[i] not in 'CSQTAcsqta':
            args.append(float(tokens[i]))
            i += 1

        # ---- M/m (move) ----
        if cmd in 'Mm':
            j = 0
            while j + 1 < len(args):
                x, y = args[j], args[j + 1]
                if cmd.islower():
                    x += cx
                    y += cy
                cx, cy = x, y
                if sx is None:
                    sx, sy = x, y
                if first is None:
                    first = (x, y)
                j += 2
                # Subsequent pairs are implicit L/l (matching case)
                cmd = 'l' if cmd.islower() else 'L'

        # ---- L/l (line) ----
        elif cmd in 'Ll':
            j = 0
            while j + 1 < len(args):
                x, y = args[j], args[j + 1]
                if cmd == 'l':
                    x += cx
                    y += cy
                cx, cy = x, y
                j += 2

        # ---- H/h (horizontal line) ----
        elif cmd in 'Hh':
            for x in args:
                if cmd == 'h':
                    x += cx
                cx = x

        # ---- V/v (vertical line) ----
        elif cmd in 'Vv':
            for y in args:
                if cmd == 'v':
                    y += cy
                cy = y

        # ---- C/c (cubic bezier) ----
        elif cmd in 'Cc':
            j = 0
            while j + 5 < len(args):
                x_end, y_end = args[j + 4], args[j + 5]
                if cmd == 'c':
                    x_end += cx
                    y_end += cy
                cx, cy = x_end, y_end
                j += 6

        # ---- S/s (smooth cubic) ----
        elif cmd in 'Ss':
            j = 0
            while j + 3 < len(args):
                x_end, y_end = args[j + 2], args[j + 3]
                if cmd == 's':
                    x_end += cx
                    y_end += cy
                cx, cy = x_end, y_end
                j += 4

        # ---- Q/q (quadratic) ----
        elif cmd in 'Qq':
            j = 0
            while j + 3 < len(args):
                x_end, y_end = args[j + 2], args[j + 3]
                if cmd == 'q':
                    x_end += cx
                    y_end += cy
                cx, cy = x_end, y_end
                j += 4

        # ---- T/t (smooth quadratic) ----
        elif cmd in 'Tt':
            j = 0
            while j + 1 < len(args):
                x, y = args[j], args[j + 1]
                if cmd == 't':
                    x += cx
                    y += cy
                cx, cy = x, y
                j += 2

        # ---- A/a (arc) ----
        elif cmd in 'Aa':
            j = 0
            while j + 6 < len(args):
                rx, ry, rot, la, sf, x, y = args[j:j + 7]
                if cmd == 'a':
                    x += cx
                    y += cy
                cx, cy = x, y
                j += 7

    return first, (cx, cy)


# ---- Strip initial move --------------------------------------------------

def strip_initial_move(d):
    """Remove the leading M/m command from a d-string.

    Returns (suffix, was_relative).  If the first drawing command after
    the move is implicit (no command letter), an explicit L/l is
    inserted.
    """
    tokens = tokenize_path(d)
    if not tokens or tokens[0] not in 'Mm':
        return d, False

    was_relative = tokens[0] == 'm'
    tokens = tokens[1:]

    # Remove the first two numeric args (the move destination)
    removed = 0
    while removed < 2 and tokens:
        t = tokens.pop(0)
        # Skip over any non-numeric tokens (shouldn't happen right after M)
        try:
            float(t)
            removed += 1
        except ValueError:
            continue

    if not tokens:
        return '', was_relative

    # Check whether the remaining tokens start with a command letter
    first = tokens[0]
    is_cmd = first in 'MLHVZCmlhvz' or first in 'CSQTAcsqta'

    if is_cmd:
        return ' '.join(tokens), was_relative

    # Implicit line after the move — insert explicit command
    prefix = 'l' if was_relative else 'L'
    return prefix + ' ' + ' '.join(tokens), was_relative


# ---- Point helpers (still needed for polylines) --------------------------

def parse_points(s):
    s = s.replace(',', ' ')
    nums = [float(x) for x in s.split()]
    return [(nums[i], nums[i + 1]) for i in range(0, len(nums), 2)]


def pts_to_str(pts):
    return ' '.join(f'{x:g},{y:g}' for x, y in pts)


def pt_key(p):
    return (round(p[0] / TOLERANCE) * TOLERANCE,
            round(p[1] / TOLERANCE) * TOLERANCE)


def pts_eq(a, b):
    return abs(a[0] - b[0]) < TOLERANCE and abs(a[1] - b[1]) < TOLERANCE


# ---- Style helpers -------------------------------------------------------

def parse_css_style(s):
    d = {}
    for part in s.split(';'):
        if ':' in part:
            k, v = part.split(':', 1)
            d[k.strip()] = v.strip()
    return d


def style_tuple_from_dict(d):
    keys = ['stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
            'stroke-opacity', 'stroke-dasharray', 'stroke-miterlimit',
            'fill', 'fill-opacity', 'fill-rule']
    return tuple(d.get(k) for k in keys)


# ---- Collection ----------------------------------------------------------

def _collect_one(child, parent_attrs, items):
    """Extract a single element into an item dict {start, end, full_d, attrs, style}."""
    tag_name = child.tag

    if tag_name == tag('polyline'):
        pts = parse_points(child.get('points', ''))
        if len(pts) < 2:
            return
        full_d = 'M ' + pts_to_str(pts)
        start, end = pts[0], pts[-1]

    elif tag_name == tag('path'):
        d = child.get('d', '')
        if not d:
            return
        ep = path_endpoints(d)
        if ep[0] is None:
            return
        start, (ex, ey) = ep
        end = (ex, ey)
        full_d = d

    else:
        return

    attrs = dict(parent_attrs)
    for k, v in child.attrib.items():
        if k not in ('points', 'd'):
            attrs[k] = v
    style_str = attrs.pop('style', '')
    for k, v in parse_css_style(style_str).items():
        attrs[k] = v

    items.append({
        'start': start,
        'end': end,
        'full_d': full_d,
        'attrs': attrs,
        'style': style_tuple_from_dict(attrs),
    })


def collect_items(root):
    """Return list of dicts, one per <polyline> / <path> element.

    Skips elements inside <defs>.
    """
    items = []

    # Layout 1: elements as direct children of <svg> (skip defs)
    direct = [c for c in root
              if c.tag in (tag('polyline'), tag('path'))
              and c.tag != tag('defs')]

    if direct:
        for child in direct:
            _collect_one(child, {}, items)
        return items

    # Layout 2: walk the tree, skipping defs
    def walk(elem, parent_attrs):
        if elem.tag == tag('defs'):
            return
        for child in list(elem):
            if child.tag == tag('g'):
                g_attrs = dict(parent_attrs)
                g_attrs.update(child.attrib)
                style_str = g_attrs.pop('style', '')
                for k, v in parse_css_style(style_str).items():
                    g_attrs[k] = v
                walk(child, g_attrs)
            elif child.tag in (tag('polyline'), tag('path')):
                _collect_one(child, parent_attrs, items)

    walk(root, {})
    return items


# ---- Component detection -------------------------------------------------

def find_components(items):
    n = len(items)
    adj = [[] for _ in range(n)]

    pt_map = {}
    for i, item in enumerate(items):
        for ep in (item['start'], item['end']):
            pt_map.setdefault(pt_key(ep), []).append(i)

    for i in range(n):
        item = items[i]
        seen = set()
        for ep in (item['start'], item['end']):
            for j in pt_map.get(pt_key(ep), []):
                if i != j and j not in seen:
                    seen.add(j)
                    adj[i].append(j)

    visited = [False] * n
    comps = []
    for i in range(n):
        if not visited[i]:
            stack = [i]
            comp = []
            while stack:
                v = stack.pop()
                if not visited[v]:
                    visited[v] = True
                    comp.append(v)
                    for u in adj[v]:
                        if not visited[u]:
                            stack.append(u)
            comps.append(comp)
    return comps


# ---- Path reversal -------------------------------------------------------

def _reverse_coords(coords, is_relative):
    """Reverse a list of coordinate pairs (each relative to previous)."""
    if is_relative:
        # Negate and reverse order — each pair becomes the inverse
        result = []
        i = len(coords) - 2
        while i >= 0:
            result.append(-coords[i])
            result.append(-coords[i + 1])
            i -= 2
        return result
    else:
        # Absolute: reverse order
        result = []
        i = len(coords) - 2
        while i >= 0:
            result.append(coords[i])
            result.append(coords[i + 1])
            i -= 2
        return result


def reverse_segment(item):
    """Return d suffix (initial move stripped) for traversing this segment backward.

    Handles line-only paths (implicit L) and arc paths (explicit a/A).
    Other curve types (C/S/Q/T) are returned unreversed with a warning.
    """
    d = item['full_d']
    _, was_relative = strip_initial_move(d)
    suffix, _ = strip_initial_move(d)

    if not suffix:
        return suffix

    suffix_tokens = tokenize_path(suffix)

    # Classify: curve or line?
    is_curve = any(t in 'CSQTAcsqta' for t in suffix_tokens)

    if is_curve:
        return _reverse_curve_suffix(suffix_tokens, was_relative)
    else:
        return _reverse_line_suffix(suffix_tokens, was_relative)


def _reverse_line_suffix(tokens, was_relative):
    """Reverse a line-only suffix by converting to absolute points and back."""
    pts = [(0.0, 0.0)]
    cx = cy = 0.0
    cmd = 'l' if was_relative else 'L'
    i = 0

    while i < len(tokens):
        t = tokens[i]

        if t in 'Hh':
            cmd = t
            i += 1
            if i >= len(tokens):
                break
            x = float(tokens[i])
            i += 1
            if cmd == 'h':
                cx += x
            else:
                cx = x
            pts.append((cx, cy))
            continue

        if t in 'Vv':
            cmd = t
            i += 1
            if i >= len(tokens):
                break
            y = float(tokens[i])
            i += 1
            if cmd == 'v':
                cy += y
            else:
                cy = y
            pts.append((cx, cy))
            continue

        if t in 'Ll':
            cmd = t
            i += 1
            continue

        # Number — treat as L/l pair
        x = float(t)
        y = float(tokens[i + 1]) if i + 1 < len(tokens) else 0
        i += 2
        if cmd == 'l':
            cx += x
            cy += y
        else:
            cx, cy = x, y
        pts.append((cx, cy))

    if len(pts) < 1:
        return ''

    # Reverse points and output as relative L
    pts.reverse()
    parts = []
    for j in range(1, len(pts)):
        dx = pts[j][0] - pts[j - 1][0]
        dy = pts[j][1] - pts[j - 1][1]
        parts.append(f'{dx:g},{dy:g}')

    if parts:
        return 'l ' + ' '.join(parts)
    return ''


def _reverse_curve_suffix(tokens, was_relative):
    """Reverse a suffix containing arc (a/A) commands.

    For each arc: toggle sweep flag, negate dx/dy.
    Multi-arc paths (implicit repeated a) are reversed in order.
    Curves (C/S/Q/T) are passed through unreversed (best-effort).
    """
    i = 0
    out = []
    while i < len(tokens):
        t = tokens[i]
        if t in 'Aa':
            # Arc: rx ry rot la sf dx dy (7 args)
            i += 1
            args = []
            while i < len(tokens) and tokens[i] not in 'CSQTAcsqta':
                args.append(tokens[i])
                i += 1
            # Process arc in chunks of 7
            j = 0
            while j + 6 < len(args):
                rx, ry, rot, la, sf, dx, dy = map(float, args[j:j + 7])
                new_sf = 1 if int(sf) == 0 else 0  # toggle sweep
                dx_neg = -dx if was_relative else dx
                dy_neg = -dy if was_relative else dy
                if was_relative:
                    out.append(f'a {rx:g} {ry:g} {rot:g} {int(float(la)):g} {new_sf:g} {dx_neg:g} {dy_neg:g}')
                else:
                    out.append(f'A {rx:g} {ry:g} {rot:g} {int(float(la)):g} {new_sf:g} {dx_neg:g} {dy_neg:g}')
                j += 7
        elif t in 'HhVvCcSsQqTt':
            # Other curve types — pass through unreversed (best-effort)
            i += 1
            out.append(t)
            while i < len(tokens) and tokens[i] not in 'CSQTAcsqta' and tokens[i] not in 'MLHVZCmlhvz':
                out.append(tokens[i])
                i += 1
        else:
            i += 1

    return ' '.join(out)


# ---- Path tracing (endpoint-based) ---------------------------------------

def trace_path_endpoints(items, indices):
    """Return list of (idx, forward) in connected order, and whether closed.

    forward=True  → segment is traversed from start to end (use full_d)
    forward=False → segment is traversed from end to start (use reverse_segment)
    """
    if not indices:
        return [], False

    if len(indices) == 1:
        idx = indices[0]
        closed = pts_eq(items[idx]['start'], items[idx]['end'])
        return [(idx, True)], closed

    ep_map = {}
    for idx in indices:
        item = items[idx]
        k0 = pt_key(item['start'])
        k1 = pt_key(item['end'])
        ep_map.setdefault(k0, []).append((idx, 'start'))
        if k0 != k1:
            ep_map.setdefault(k1, []).append((idx, 'end'))

    used = set()
    result = []

    cur_idx = indices[0]
    cur_item = items[cur_idx]
    used.add(cur_idx)
    result.append((cur_idx, True))
    cur_ep = cur_item['end']
    cur_key = pt_key(cur_ep)

    while len(used) < len(indices):
        candidates = ep_map.get(cur_key, [])
        nxt = None
        for idx, which in candidates:
            if idx not in used:
                nxt = (idx, which)
                break
        if nxt is None:
            break
        nxt_idx, which = nxt
        used.add(nxt_idx)
        # If we enter at start → forward; if we enter at end → backward
        forward = (which == 'start')
        result.append((nxt_idx, forward))
        nxt_item = items[nxt_idx]
        # Forward: enter at start → exit at end.  Backward: enter at end → exit at start.
        cur_ep = nxt_item['end'] if forward else nxt_item['start']
        cur_key = pt_key(cur_ep)

    first_start = items[result[0][0]]['start']
    last_end = items[result[-1][0]]['end'] if result[-1][1] else items[result[-1][0]]['start']
    closed = pts_eq(first_start, last_end)
    return result, closed


def is_cycle(items, indices):
    ec = {}
    for idx in indices:
        item = items[idx]
        k0 = pt_key(item['start'])
        k1 = pt_key(item['end'])
        ec[k0] = ec.get(k0, 0) + 1
        ec[k1] = ec.get(k1, 0) + 1
    return all(v % 2 == 0 for v in ec.values())


# ---- Main ----------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        print(f'Usage: {sys.argv[0]} input.svg [output.svg]', file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else input_path

    tree = ET.parse(input_path)
    root = tree.getroot()

    items = collect_items(root)
    if not items:
        print('No polylines or paths found, writing unchanged SVG.',
              file=sys.stderr)
        tree.write(output_path, xml_declaration=True, encoding='UTF-8')
        return

    print(f'Collected {len(items)} segment(s).', file=sys.stderr)

    # Group by style
    groups = {}
    for item in items:
        groups.setdefault(item['style'], []).append(item)
    print(f'Found {len(groups)} style group(s).', file=sys.stderr)

    new_paths = []

    for style, segs in groups.items():
        comps = find_components(segs)
        n_closed = 0
        for comp in comps:
            trace, seg_closed = trace_path_endpoints(segs, comp)
            if not trace:
                continue

            first = segs[trace[0][0]]
            merged_d = first['full_d']

            for idx, forward in trace[1:]:
                if forward:
                    suffix, _ = strip_initial_move(segs[idx]['full_d'])
                else:
                    suffix = reverse_segment(segs[idx])
                if suffix:
                    merged_d += ' ' + suffix

            comp_indices = [t[0] for t in trace]
            should_close = seg_closed or (len(comp_indices) > 1 and is_cycle(segs, comp_indices))
            if should_close and not re.search(r'\b[Zz]\s*$', merged_d):
                merged_d += ' Z'
                n_closed += 1
            elif should_close:
                n_closed += 1

            attrs = dict(segs[trace[0][0]]['attrs'])
            for k in list(attrs.keys()):
                if k not in PATH_KEEP:
                    del attrs[k]
            attrs['d'] = merged_d
            new_paths.append(attrs)

        print(f'  Style: {len(segs)} segments → {len(comps)} paths '
              f'({n_closed} closed).', file=sys.stderr)

    # Remove original elements (skip defs)
    for child in list(root):
        if child.tag == tag('defs'):
            continue
        if child.tag in (tag('polyline'), tag('path')):
            root.remove(child)

    # Remove empty <g> elements (style-reference groups)
    for child in list(root):
        if child.tag == tag('g') and len(list(child)) == 0 and len(child.attrib) > 0:
            root.remove(child)

    for attrs in new_paths:
        ET.SubElement(root, tag('path'), attrib=attrs)

    tree.write(output_path, xml_declaration=True, encoding='UTF-8')
    print(f'Wrote {output_path}', file=sys.stderr)


if __name__ == '__main__':
    main()
