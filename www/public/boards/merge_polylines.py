#!/usr/bin/env python3
"""Merge connected polylines in an SVG into closed shapes.

Usage: python3 merge_polylines.py input.svg [output.svg]

Collects ALL polylines, finds connected components (polylines sharing
endpoints), and merges each component into a single <path> element.

Handles two SVG layouts:
  - Polylines as direct children of <svg> (with inline style + transform)
  - Polylines inside <g> elements (style inherited from group)

Produces a clean SVG where each connected shape is a single closed <path>.
"""

import xml.etree.ElementTree as ET
import sys

SVG_NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG_NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

TOLERANCE = 0.5

# Attributes to keep on path elements (remove presentation-only noise)
PATH_KEEP = {
    'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
    'stroke-opacity', 'stroke-dasharray', 'stroke-miterlimit',
    'fill-opacity', 'fill-rule', 'transform', 'd',
}


def tag(name):
    return f'{{{SVG_NS}}}{name}'


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


def collect_polylines(root):
    """Return list of dicts: {points, attrs, style_tuple}."""
    items = []

    # Check if polylines are direct children of <svg> (layout 1)
    direct_polys = [c for c in root if c.tag == tag('polyline')]

    if direct_polys:
        # Layout 1: polylines as direct children with inline style
        for child in direct_polys:
            pts_str = child.get('points', '')
            pts = parse_points(pts_str)
            if len(pts) < 2:
                continue
            attrs = dict(child.attrib)
            # Parse style attribute
            style_str = attrs.pop('style', '')
            style_dict = parse_css_style(style_str)
            for k, v in style_dict.items():
                attrs[k] = v
            items.append({
                'points': pts,
                'attrs': attrs,
                'style': style_tuple_from_dict(attrs),
            })
        return items

    # Layout 2: polylines inside <g> elements
    def walk(elem, parent_g):
        for child in list(elem):
            if child.tag == tag('g'):
                walk(child, child)
            elif child.tag == tag('polyline'):
                pts_str = child.get('points', '')
                pts = parse_points(pts_str)
                if len(pts) < 2:
                    continue
                attrs = dict(parent_g.attrib)
                for k, v in child.attrib.items():
                    if k != 'points':
                        attrs[k] = v
                style_str = attrs.pop('style', '')
                style_dict = parse_css_style(style_str)
                for k, v in style_dict.items():
                    attrs[k] = v
                items.append({
                    'points': pts,
                    'attrs': attrs,
                    'style': style_tuple_from_dict(attrs),
                })

    walk(root, root)
    return items


def find_components(items):
    n = len(items)
    adj = [[] for _ in range(n)]

    pt_map = {}
    for i, item in enumerate(items):
        for ep in (item['points'][0], item['points'][-1]):
            pt_map.setdefault(pt_key(ep), []).append(i)

    for i in range(n):
        pts = items[i]['points']
        seen = set()
        for ep in (pts[0], pts[-1]):
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


def trace_path(items, indices):
    if not indices:
        return [], False

    if len(indices) == 1:
        pts = items[indices[0]]['points']
        if pts_eq(pts[0], pts[-1]):
            return pts[:-1], True
        return pts, False

    ep_map = {}
    for idx in indices:
        pts = items[idx]['points']
        k0 = pt_key(pts[0])
        k1 = pt_key(pts[-1])
        ep_map.setdefault(k0, []).append((idx, 0))
        if k0 != k1:
            ep_map.setdefault(k1, []).append((idx, 1))

    used = set()
    result = []

    cur_idx = indices[0]
    cur_pts = items[cur_idx]['points']
    used.add(cur_idx)
    result.extend(cur_pts)
    cur_ep = cur_pts[-1]
    cur_ep_key = pt_key(cur_ep)

    while len(used) < len(indices):
        cand = ep_map.get(cur_ep_key, [])
        nxt = None
        for idx, which_end in cand:
            if idx not in used:
                nxt = (idx, which_end)
                break
        if nxt is None:
            break
        nxt_idx, which_end = nxt
        used.add(nxt_idx)
        nxt_pts = items[nxt_idx]['points']
        if which_end == 0:
            result.extend(nxt_pts[1:])
            cur_ep = nxt_pts[-1]
        else:
            result.extend(reversed(nxt_pts[:-1]))
            cur_ep = nxt_pts[0]
        cur_ep_key = pt_key(cur_ep)

    closed = pts_eq(result[0], result[-1])
    if closed:
        result = result[:-1]
    return result, closed


def is_cycle(items, indices):
    ec = {}
    for idx in indices:
        pts = items[idx]['points']
        k0 = pt_key(pts[0])
        k1 = pt_key(pts[-1])
        ec[k0] = ec.get(k0, 0) + 1
        ec[k1] = ec.get(k1, 0) + 1
    return all(v % 2 == 0 for v in ec.values())


def main():
    if len(sys.argv) < 2:
        print(f'Usage: {sys.argv[0]} input.svg [output.svg]', file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else input_path

    tree = ET.parse(input_path)
    root = tree.getroot()

    items = collect_polylines(root)
    if not items:
        print('No polylines found, writing unchanged SVG.', file=sys.stderr)
        tree.write(output_path, xml_declaration=True, encoding='UTF-8')
        return

    print(f'Collected {len(items)} polylines.', file=sys.stderr)

    # Group by style tuple
    groups = {}
    for item in items:
        groups.setdefault(item['style'], []).append(item)
    print(f'Found {len(groups)} style group(s).', file=sys.stderr)

    new_paths = []

    for style, polys in groups.items():
        comps = find_components(polys)
        n_closed = 0
        for comp in comps:
            traced, is_closed = trace_path(polys, comp)
            if not traced:
                continue
            should_close = is_closed or (len(comp) > 1 and is_cycle(polys, comp))
            if should_close:
                d = f'M {pts_to_str(traced)} Z'
                n_closed += 1
            else:
                d = f'M {pts_to_str(traced)}'

            attrs = dict(polys[comp[0]]['attrs'])
            for k in list(attrs.keys()):
                if k not in PATH_KEEP:
                    del attrs[k]
            attrs['d'] = d
            new_paths.append(attrs)
        print(f'  Style: {len(polys)} polys → {len(comps)} paths ({n_closed} closed).', file=sys.stderr)

    # Remove original polylines
    for child in list(root):
        if child.tag == tag('polyline'):
            root.remove(child)
    # Remove empty <g> elements (style-reference groups)
    for child in list(root):
        if child.tag == tag('g') and len(list(child)) == 0 and len(child.attrib) > 0:
            root.remove(child)

    # Add new paths
    for attrs in new_paths:
        ET.SubElement(root, tag('path'), attrib=attrs)

    tree.write(output_path, xml_declaration=True, encoding='UTF-8')
    print(f'Wrote {output_path}', file=sys.stderr)


if __name__ == '__main__':
    main()
