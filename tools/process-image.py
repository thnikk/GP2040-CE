#!/usr/bin/env python3
"""Process PNG images: round corners, add padding, add drop shadow."""

import argparse
from PIL import Image, ImageDraw, ImageFilter


def round_corners(image, radius):
    """Round image corners with antialiasing via supersampling."""
    image = image.convert('RGBA')
    scale = 4
    mask_size = (image.width * scale, image.height * scale)
    mask = Image.new('L', mask_size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        [(0, 0), (mask_size[0] - 1, mask_size[1] - 1)],
        radius=radius * scale,
        fill=255,
    )
    mask = mask.resize(image.size, Image.LANCZOS)
    alpha = image.split()[3]
    alpha = Image.composite(
        alpha, Image.new('L', image.size, 0), mask
    )
    image.putalpha(alpha)
    return image


def expand(image, padding):
    """Add transparent padding around the image."""
    image = image.convert('RGBA')
    if isinstance(padding, int):
        padding = (padding, padding, padding, padding)
    left, top, right, bottom = padding
    new_size = (image.width + left + right, image.height + top + bottom)
    result = Image.new('RGBA', new_size, (0, 0, 0, 0))
    result.paste(image, (left, top))
    return result


def add_shadow(image, blur_radius):
    """Add a centered black drop shadow behind the image."""
    image = image.convert('RGBA')
    alpha = image.split()[3]
    shadow = Image.new('RGBA', image.size, (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 255), mask=alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur_radius))
    result = Image.new('RGBA', image.size, (0, 0, 0, 0))
    result.paste(shadow, (0, 0), shadow)
    result.paste(image, (0, 0), image)
    return result


def parse_padding(values):
    """Parse padding argument: 1 value for all sides, 4 for LTRB."""
    if len(values) == 1:
        return values[0]
    elif len(values) == 4:
        return tuple(values)
    else:
        raise argparse.ArgumentTypeError(
            'requires 1 value (all sides) or 4 values '
            '(left top right bottom)'
        )


def make_comparison(img1, img2):
    """Stitch left half of img1 with right half of img2 side by side.

    If heights differ, the taller image is resized to match the shorter.
    A 2px white vertical line marks the stitch boundary.
    """
    a = img1.convert('RGBA')
    b = img2.convert('RGBA')

    # Normalize heights — resize the taller to match the shorter
    if a.height > b.height:
        ratio = b.height / a.height
        a = a.resize((round(a.width * ratio), b.height), Image.LANCZOS)
    elif b.height > a.height:
        ratio = a.height / b.height
        b = b.resize((round(b.width * ratio), a.height), Image.LANCZOS)

    h = a.height  # now equal

    left = a.crop((0, 0, a.width // 2, h))
    right = b.crop((b.width // 2, 0, b.width, h))

    canvas = Image.new('RGBA', (left.width + right.width, h), (0, 0, 0, 0))
    canvas.paste(left, (0, 0))
    canvas.paste(right, (left.width, 0))

    draw = ImageDraw.Draw(canvas)
    draw.line([(left.width, 0), (left.width, h)], fill=(255, 255, 255, 255), width=2)

    return canvas


def main():
    parser = argparse.ArgumentParser(
        description='Process PNG images: round corners, add padding, '
        'add drop shadow, or create a side-by-side comparison.'
    )
    parser.add_argument('input', help='Input PNG file')
    parser.add_argument('output', help='Output PNG file')
    parser.add_argument(
        '-c', '--compare', type=str, default=None,
        help='Second image for side-by-side comparison '
        '(left half of input + right half of second image)'
    )
    parser.add_argument(
        '-r', '--radius', type=int, default=None,
        help='Corner radius in pixels (rounded corners)'
    )
    parser.add_argument(
        '-e', '--expand', type=int, nargs='+', default=None,
        help='Padding: 1 value for all sides, or 4 for '
        'left top right bottom'
    )
    parser.add_argument(
        '-s', '--shadow', type=int, default=None,
        help='Drop shadow blur radius in pixels'
    )

    args = parser.parse_args()

    if args.expand is not None:
        args.expand = parse_padding(args.expand)

    if args.compare is not None:
        a = Image.open(args.input).convert('RGBA')
        b = Image.open(args.compare).convert('RGBA')
        image = make_comparison(a, b)
    else:
        image = Image.open(args.input).convert('RGBA')

    if args.radius is not None:
        image = round_corners(image, args.radius)

    if args.expand is not None:
        image = expand(image, args.expand)

    if args.shadow is not None:
        image = add_shadow(image, args.shadow)

    image.save(args.output)


if __name__ == '__main__':
    main()
