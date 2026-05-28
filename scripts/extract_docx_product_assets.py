#!/usr/bin/env python3
"""Extract original images and readable product text from DOCX catalog files.

This script reads DOCX files as OOXML zip packages. Images are copied from
``word/media`` directly, so the output is the embedded original assets rather
than page screenshots or rendered previews.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import posixpath
import re
import shutil
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET


NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "v": "urn:schemas-microsoft-com:vml",
}

REL_NS = "{http://schemas.openxmlformats.org/package/2006/relationships}"
R_EMBED = f"{{{NS['r']}}}embed"
R_LINK = f"{{{NS['r']}}}link"
R_ID = f"{{{NS['r']}}}id"


@dataclass
class ImageAsset:
    source: str
    output: str
    size: int
    sha1: str


@dataclass
class ContentBlock:
    kind: str
    text: str
    rows: list[list[str]]
    images: list[str]


@dataclass
class ProductEntry:
    title: str
    series: str
    fields: dict[str, str]
    images: list[str]


def clean_name(value: str, fallback: str = "untitled") -> str:
    value = re.sub(r"[\\/:*?\"<>|]+", "-", value.strip())
    value = re.sub(r"\s+", " ", value).strip(" .")
    return value or fallback


def natural_key(value: str) -> list[object]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", value)]


def normalize_text(value: str) -> str:
    value = value.replace("\u00a0", " ")
    value = re.sub(r"[ \t\r\f\v]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def text_from_element(element: ET.Element) -> str:
    parts: list[str] = []
    for node in element.iter():
        name = local_name(node.tag)
        if name == "t" and node.text:
            parts.append(node.text)
        elif name == "tab":
            parts.append(" ")
        elif name in {"br", "cr"}:
            parts.append("\n")
    return normalize_text("".join(parts))


def image_rel_ids(element: ET.Element) -> list[str]:
    rel_ids: list[str] = []
    for node in element.iter():
        name = local_name(node.tag)
        if name == "blip":
            rel_id = node.attrib.get(R_EMBED) or node.attrib.get(R_LINK)
        elif name == "imagedata":
            rel_id = node.attrib.get(R_ID)
        else:
            rel_id = None
        if rel_id and rel_id not in rel_ids:
            rel_ids.append(rel_id)
    return rel_ids


def part_rels(docx: zipfile.ZipFile, part_name: str) -> dict[str, str]:
    part_dir = posixpath.dirname(part_name)
    rels_name = posixpath.join(part_dir, "_rels", f"{posixpath.basename(part_name)}.rels")
    if rels_name not in docx.namelist():
        return {}

    root = ET.fromstring(docx.read(rels_name))
    rels: dict[str, str] = {}
    for rel in root.findall(f"{REL_NS}Relationship"):
        rel_id = rel.attrib.get("Id")
        target = rel.attrib.get("Target")
        if not rel_id or not target:
            continue
        target = target.replace("\\", "/")
        if target.startswith("/"):
            normalized = target.lstrip("/")
        else:
            normalized = posixpath.normpath(posixpath.join(part_dir, target))
        rels[rel_id] = normalized
    return rels


def body_children(root: ET.Element) -> Iterable[ET.Element]:
    body = root.find("w:body", NS)
    if body is None:
        return []
    return list(body)


def parse_content_blocks(docx: zipfile.ZipFile, media_lookup: dict[str, str]) -> list[ContentBlock]:
    part_name = "word/document.xml"
    root = ET.fromstring(docx.read(part_name))
    rels = part_rels(docx, part_name)
    blocks: list[ContentBlock] = []

    for child in body_children(root):
        kind = local_name(child.tag)
        rel_ids = image_rel_ids(child)
        images = [media_lookup.get(rels.get(rel_id, ""), "") for rel_id in rel_ids]
        images = [image for image in images if image]

        if kind == "p":
            text = text_from_element(child)
            if text or images:
                blocks.append(ContentBlock(kind="paragraph", text=text, rows=[], images=images))
            continue

        if kind == "tbl":
            rows: list[list[str]] = []
            for tr in child.findall("w:tr", NS):
                row: list[str] = []
                for tc in tr.findall("w:tc", NS):
                    row.append(text_from_element(tc))
                if any(cell for cell in row):
                    rows.append(row)
            text = "\n".join(" | ".join(cell for cell in row if cell) for row in rows)
            if rows or images:
                blocks.append(ContentBlock(kind="table", text=text, rows=rows, images=images))

    return blocks


def markdown_table(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    width = max(len(row) for row in rows)
    normalized = [row + [""] * (width - len(row)) for row in rows]
    header = normalized[0]
    divider = ["---"] * width
    body = normalized[1:]

    def render(row: list[str]) -> str:
        escaped = [cell.replace("\n", "<br>").replace("|", "\\|") for cell in row]
        return "| " + " | ".join(escaped) + " |"

    lines = [render(header), render(divider)]
    lines.extend(render(row) for row in body)
    return "\n".join(lines)


def write_markdown(path: Path, doc_title: str, blocks: list[ContentBlock]) -> None:
    lines: list[str] = [
        f"# {doc_title} 商品说明",
        "",
        "> 本文件由 DOCX 正文直接提取，图片引用为文档内部原图文件，不是截图。",
        "",
    ]

    for index, block in enumerate(blocks, start=1):
        if block.kind == "paragraph":
            if block.text:
                lines.append(block.text)
                lines.append("")
        elif block.kind == "table":
            lines.append(f"## 表格 {index}")
            lines.append("")
            lines.append(markdown_table(block.rows) if block.rows else block.text)
            lines.append("")

        if block.images:
            for image in block.images:
                lines.append(f"[图片引用: {image}]")
            lines.append("")

    path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def write_json(path: Path, doc_title: str, blocks: list[ContentBlock], images: list[ImageAsset]) -> None:
    payload = {
        "document": doc_title,
        "note": "Images are extracted from DOCX word/media original files, not screenshots.",
        "images": [asset.__dict__ for asset in images],
        "content": [
            {
                "kind": block.kind,
                "text": block.text,
                "rows": block.rows,
                "images": block.images,
            }
            for block in blocks
        ],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def extract_images(docx: zipfile.ZipFile, out_dir: Path) -> tuple[list[ImageAsset], dict[str, str]]:
    media_names = sorted(
        (name for name in docx.namelist() if name.startswith("word/media/") and not name.endswith("/")),
        key=natural_key,
    )
    out_dir.mkdir(parents=True, exist_ok=True)

    assets: list[ImageAsset] = []
    media_lookup: dict[str, str] = {}
    for index, media_name in enumerate(media_names, start=1):
        data = docx.read(media_name)
        source_name = Path(media_name).name
        output_name = f"{index:03d}_{clean_name(source_name)}"
        output_path = out_dir / output_name
        output_path.write_bytes(data)
        sha1 = hashlib.sha1(data).hexdigest()
        rel_output = f"images/{output_name}"
        media_lookup[media_name] = rel_output
        assets.append(ImageAsset(source=media_name, output=rel_output, size=len(data), sha1=sha1))

    return assets, media_lookup


def write_image_manifest(path: Path, images: list[ImageAsset]) -> None:
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=["output", "source", "size", "sha1"])
        writer.writeheader()
        for asset in images:
            writer.writerow(asset.__dict__)


def write_reference_markdown(path: Path, blocks: list[ContentBlock]) -> None:
    lines = ["# 图片引用关系", "", "按 DOCX 正文顺序列出图片附近的文字，方便判断图片属于哪个商品。", ""]
    count = 0
    for block in blocks:
        if not block.images:
            continue
        count += 1
        snippet = block.text.replace("\n", " ")
        if len(snippet) > 180:
            snippet = snippet[:180].rstrip() + "..."
        lines.append(f"## 引用 {count}")
        lines.append("")
        for image in block.images:
            lines.append(f"- 图片：{image}")
        lines.append(f"- 附近文字：{snippet or '无文字，仅图片'}")
        lines.append("")
    if count == 0:
        lines.append("未在正文中找到可映射的图片引用，但原图已从 word/media 提取。")
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def table_fields(rows: list[list[str]]) -> dict[str, str]:
    fields: dict[str, str] = {}
    for row in rows:
        if len(row) < 2:
            continue
        key = normalize_text(row[0])
        value = normalize_text(" / ".join(cell for cell in row[1:] if cell))
        if key and value:
            fields[key] = value
    return fields


def is_product_table(block: ContentBlock) -> bool:
    if block.kind != "table":
        return False
    fields = table_fields(block.rows)
    return "产品名称" in fields


def extract_product_entries(blocks: list[ContentBlock]) -> list[ProductEntry]:
    products: list[ProductEntry] = []
    current: ProductEntry | None = None
    pending_series = ""

    for block in blocks:
        if is_product_table(block):
            if current:
                products.append(current)
            fields = table_fields(block.rows)
            current = ProductEntry(
                title=fields.get("产品名称", f"商品 {len(products) + 1}"),
                series=pending_series,
                fields=fields,
                images=list(block.images),
            )
            pending_series = ""
            continue

        if current and block.images and not block.text:
            for image in block.images:
                if image not in current.images:
                    current.images.append(image)
            continue

        if current and block.images:
            for image in block.images:
                if image not in current.images:
                    current.images.append(image)

        if block.kind == "paragraph" and block.text:
            if current:
                products.append(current)
                current = None
            pending_series = block.text

    if current:
        products.append(current)

    return products


def product_slug(index: int, title: str) -> str:
    return f"{index:03d}_{clean_name(title, f'product-{index:03d}')}"


def category_from_title(doc_title: str) -> str:
    value = doc_title
    value = re.sub(r"产品册(模版)?", "", value)
    value = re.sub(r"最终版", "", value)
    value = re.sub(r"\d+(?:\.\d+)+", "", value)
    value = value.replace("——", " ").replace("---", " ").replace("--", " ").replace("-", " ")
    value = re.sub(r"[（）()]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"系列$", "", value).strip()
    return clean_name(value, doc_title)


def write_product_markdown(path: Path, product: ProductEntry) -> None:
    lines = [f"# {product.title}", ""]
    if product.series:
        lines.extend([f"系列：{product.series}", ""])
    if product.fields:
        lines.extend(["## 商品说明", ""])
        for key, value in product.fields.items():
            lines.append(f"- {key}：{value}")
        lines.append("")
    if product.images:
        lines.extend(["## 图片", ""])
        for image in product.images:
            lines.append(f"- images/{Path(image).name}")
        lines.append("")
    path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def write_product_outputs(doc_out: Path, products: list[ProductEntry]) -> None:
    split_root = doc_out / "按商品拆分"
    split_root.mkdir(parents=True, exist_ok=True)

    rows: list[dict[str, str]] = []
    for index, product in enumerate(products, start=1):
        product_dir = split_root / product_slug(index, product.title)
        image_dir = product_dir / "images"
        image_dir.mkdir(parents=True, exist_ok=True)

        for image in product.images:
            source = doc_out / image
            if source.exists():
                shutil.copy2(source, image_dir / source.name)

        write_product_markdown(product_dir / "说明.md", product)
        rows.append(
            {
                "index": str(index),
                "title": product.title,
                "series": product.series,
                "sku": product.fields.get("货号", ""),
                "image_count": str(len(product.images)),
                "folder": str(product_dir),
            }
        )

    with (doc_out / "商品条目.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=["index", "title", "series", "sku", "image_count", "folder"])
        writer.writeheader()
        writer.writerows(rows)

    payload = [
        {
            "title": product.title,
            "series": product.series,
            "fields": product.fields,
            "images": product.images,
        }
        for product in products
    ]
    (doc_out / "商品条目.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = ["# 商品条目", ""]
    for index, product in enumerate(products, start=1):
        lines.append(f"## {index:03d}. {product.title}")
        lines.append("")
        if product.series:
            lines.append(f"- 系列：{product.series}")
        if product.fields.get("货号"):
            lines.append(f"- 货号：{product.fields['货号']}")
        lines.append(f"- 图片数：{len(product.images)}")
        lines.append("")
    (doc_out / "商品条目.md").write_text("\n".join(lines), encoding="utf-8")


def copy_product_folder(source_product_dir: Path, target_product_dir: Path) -> None:
    if target_product_dir.exists():
        shutil.rmtree(target_product_dir)
    shutil.copytree(source_product_dir, target_product_dir)


def write_global_product_catalog(output_root: Path, summaries: list[dict[str, object]]) -> None:
    catalog_root = output_root / "按产品分类"
    if catalog_root.exists():
        shutil.rmtree(catalog_root)
    catalog_root.mkdir(parents=True)

    rows: list[dict[str, str]] = []
    product_index = 0
    for summary in summaries:
        doc_title = Path(str(summary["document"])).stem
        source_doc_dir = Path(str(summary["output"]))
        product_json = source_doc_dir / "商品条目.json"
        split_root = source_doc_dir / "按商品拆分"
        if not product_json.exists() or not split_root.exists():
            continue

        category = category_from_title(doc_title)
        products = json.loads(product_json.read_text(encoding="utf-8"))
        for local_index, product in enumerate(products, start=1):
            product_index += 1
            title = str(product.get("title") or f"商品 {local_index}")
            fields = product.get("fields") or {}
            sku = str(fields.get("货号") or "").strip()
            series = clean_name(str(product.get("series") or "未分组"), "未分组")
            folder_name = clean_name(f"{local_index:03d}_{title}{f'_{sku}' if sku else ''}")

            source_product_dir = split_root / product_slug(local_index, title)
            if not source_product_dir.exists():
                continue

            target_product_dir = catalog_root / category / series / folder_name
            copy_product_folder(source_product_dir, target_product_dir)
            rows.append(
                {
                    "index": str(product_index),
                    "category": category,
                    "series": series,
                    "title": title,
                    "sku": sku,
                    "image_count": str(len(product.get("images") or [])),
                    "source_document": str(summary["document"]),
                    "folder": str(target_product_dir),
                }
            )

    with (catalog_root / "产品分类总表.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["index", "category", "series", "title", "sku", "image_count", "source_document", "folder"],
        )
        writer.writeheader()
        writer.writerows(rows)

    lines = [
        "# 按产品分类",
        "",
        "这里是面向人工整理和网站录入的总目录：按品类 / 系列 / 产品三级整理，每个产品一个文件夹。",
        "",
        "| 序号 | 品类 | 系列 | 产品 | 货号 | 图片数 |",
        "| ---: | --- | --- | --- | --- | ---: |",
    ]
    for row in rows:
        lines.append(
            f"| {row['index']} | {row['category']} | {row['series']} | {row['title']} | {row['sku']} | {row['image_count']} |"
        )
    (catalog_root / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def process_docx(docx_path: Path, output_root: Path) -> dict[str, object]:
    doc_title = docx_path.stem
    doc_out = output_root / clean_name(doc_title)
    if doc_out.exists():
        shutil.rmtree(doc_out)
    doc_out.mkdir(parents=True)

    with zipfile.ZipFile(docx_path) as docx:
        images, media_lookup = extract_images(docx, doc_out / "images")
        blocks = parse_content_blocks(docx, media_lookup)

    write_markdown(doc_out / "商品说明.md", doc_title, blocks)
    write_json(doc_out / "商品说明.json", doc_title, blocks, images)
    write_image_manifest(doc_out / "图片清单.csv", images)
    write_reference_markdown(doc_out / "图片引用关系.md", blocks)
    products = extract_product_entries(blocks)
    write_product_outputs(doc_out, products)

    return {
        "document": docx_path.name,
        "output": str(doc_out),
        "image_count": len(images),
        "block_count": len(blocks),
        "product_count": len(products),
    }


def write_readme(output_root: Path, summaries: list[dict[str, object]]) -> None:
    lines = [
        "# 产品资料拆分结果",
        "",
        "这些文件从 Word 文档内部直接提取：",
        "",
        "- `按产品分类/`：总整理目录，按品类 / 系列 / 产品三级存放，每个产品一个文件夹。",
        "- `images/`：DOCX 内嵌原图，来自 `word/media`，不是截图。",
        "- `商品说明.md`：按文档正文顺序提取的可读商品说明。",
        "- `商品说明.json`：结构化文本与图片引用，方便后续程序导入。",
        "- `图片清单.csv`：原图文件清单与校验信息。",
        "- `图片引用关系.md`：图片在正文中的引用位置和附近文字。",
        "",
        "## 汇总",
        "",
        "| 文档 | 图片数 | 内容块数 | 商品数 | 输出目录 |",
        "| --- | ---: | ---: | ---: | --- |",
    ]
    for item in summaries:
        lines.append(
            f"| {item['document']} | {item['image_count']} | {item['block_count']} | {item['product_count']} | {item['output']} |"
        )
    output_root.joinpath("README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_dir", type=Path)
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()

    input_dir = args.input_dir.resolve()
    output_root = (args.output or input_dir / "拆分结果").resolve()
    output_root.mkdir(parents=True, exist_ok=True)

    docx_files = sorted(input_dir.glob("*.docx"), key=lambda path: natural_key(path.name))
    if not docx_files:
        raise SystemExit(f"No DOCX files found in {input_dir}")

    summaries = [process_docx(path, output_root) for path in docx_files]
    write_global_product_catalog(output_root, summaries)
    write_readme(output_root, summaries)

    print(json.dumps(summaries, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
