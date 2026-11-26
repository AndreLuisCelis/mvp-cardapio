export function isSafeDisplayUrl(url: string): boolean {
  const trimmed = (url || '').trim();
  if (!trimmed) return true;
  if (trimmed.length > 350000) return false;
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/') ||
    /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)
  );
}

export function slugifyCategoryKey(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export async function compressImageFileToDataUrl(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<string> {
  const { maxWidth = 720, maxHeight = 720, quality = 0.8 } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem válido (PNG, JPG ou WebP).');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível processar a imagem selecionada.'));
    image.src = dataUrl;
  });

  const ratio = Math.min(1, maxWidth / img.width, maxHeight / img.height);
  const targetWidth = Math.max(1, Math.round(img.width * ratio));
  const targetHeight = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Contexto gráfico indisponível no navegador.');
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  let result = canvas.toDataURL(outputMime, quality);

  // Fallback to JPEG if PNG base64 exceeds Firestore safe size limit (~320KB)
  if (result.length > 320000) {
    result = canvas.toDataURL('image/jpeg', 0.72);
  }
  if (result.length > 340000) {
    result = canvas.toDataURL('image/jpeg', 0.55);
  }
  if (result.length > 349000) {
    throw new Error('Imagem muito grande mesmo após compressão. Escolha uma imagem menor.');
  }

  return result;
}
