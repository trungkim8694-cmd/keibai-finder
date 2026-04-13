import fitz  # PyMuPDF
import os

def pdf_to_text(pdf_path: str) -> str:
    """Extract and concatenate text from all pages of a PDF."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
        return text
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return ""

def extract_text_and_purge(pdf_paths: list) -> str:
    """
    Core pipeline snippet:
    1. Extract text from PDFs.
    2. Limit length (200000 chars limit).
    3. Delete PDFs to save space immediately.
    4. Return text string.
    """
    full_text = ""
    for path in pdf_paths:
        if os.path.exists(path):
            full_text += f"--- CONTENT OF FILE: {os.path.basename(path)} ---\n"
            full_text += pdf_to_text(path) + "\n\n"
            
    # Cap string length broadly to avoid excessive payload
    if len(full_text) > 200000:
        full_text = full_text[:200000]

    # The Purge
    for path in pdf_paths:
        if os.path.exists(path):
            try:
                os.remove(path)
                print(f"[Purge] Deleted physical file: {os.path.basename(path)}")
            except Exception as e:
                print(f"[Purge] Failed to delete {path}: {e}")

    return full_text
