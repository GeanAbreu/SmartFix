from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont
from docx import Document


ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "docs" / "monografia" / "Monografia_SmartFix_Atualizada_2026.docx"
OUT = ROOT / "tmp" / "trello_evidencias"
OUT.mkdir(parents=True, exist_ok=True)


def font(size: int, bold: bool = False):
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


doc = Document(DOCX)
paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]


def exact_paragraph(prefix: str) -> str:
    for text in paragraphs:
        if text.startswith(prefix):
            return text
    raise RuntimeError(f"Trecho não encontrado: {prefix}")


def draw_wrapped(draw, text, xy, max_chars, fnt, fill, spacing=12):
    x, y = xy
    lines = []
    for paragraph in text.split("\n"):
        lines.extend(wrap(paragraph, width=max_chars) or [""])
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + spacing
    return y


def make_card(filename: str, card_title: str, section: str, excerpt: str, diagram: Path | None = None):
    width = 1400
    height = 1050 if diagram else 820
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    navy = "#17365D"
    gray = "#4F5B66"
    draw.rectangle((0, 0, width, 120), fill=navy)
    draw.text((60, 30), "EVIDÊNCIA NA MONOGRAFIA SMARTFIX", font=font(38, True), fill="white")
    y = 160
    y = draw_wrapped(draw, card_title, (60, y), 58, font(34, True), navy, 8) + 18
    draw.text((60, y), f"Localização: {section}", font=font(25, True), fill=gray)
    y += 60
    draw.rounded_rectangle((45, y - 15, width - 45, height - 95), radius=18, outline="#B8C4D2", width=3, fill="#F7F9FC")
    y += 20
    draw.text((75, y), "Trecho textual extraído do arquivo .docx:", font=font(25, True), fill=navy)
    y += 48
    y = draw_wrapped(draw, excerpt, (75, y), 92, font(25), "#111111", 10) + 22
    if diagram:
        source = Image.open(diagram).convert("RGB")
        source.thumbnail((1000, 360))
        image.paste(source, ((width - source.width) // 2, y))
    footer = f"Fonte: {DOCX.name}"
    draw.text((60, height - 62), footer, font=font(22), fill=gray)
    image.save(OUT / filename, quality=95)


make_card(
    "01_maquina_estados.png",
    "Relatório Técnico - Máquina de Estados da OS",
    "Capítulo 5, seção 5.5 Diagrama de estados da ordem",
    exact_paragraph("A máquina de estados controla as transições permitidas"),
    ROOT / "tmp" / "monografia_assets" / "estados.png",
)

make_card(
    "05_interface_solicitacao.png",
    "Interface Real de Solicitação de Reparo",
    "Capítulo 6, seção 6.9 Interfaces do cliente",
    exact_paragraph("O dashboard destaca orçamentos aguardando decisão"),
)

make_card(
    "06_api_acompanhamento_os.png",
    "API de Acompanhamento e Atualização de OS",
    "Capítulo 6, seções 6.3 e 6.8",
    exact_paragraph("A política de ordens concentra ações de orçamento"),
)

make_card(
    "07_api_dispositivo_triagem.png",
    "API de Vínculo de Dispositivo e Triagem",
    "Capítulo 5, seção 5.4.3 Solicitação diagnóstico e orçamento",
    exact_paragraph("A criação da ordem começa com a seleção de um dispositivo"),
)

print(OUT)
