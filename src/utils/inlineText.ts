export type TextPart = { type: 'text'; value: string } | { type: 'image'; uri: string };

// "Izračunaj {{slika}} na intervalu" postane ["Izračunaj ", " na intervalu"]
// slika ide između svaka dva komada, nikad poslije posljednjeg
export function parseInlineText(text: string, images: string[]): TextPart[] {
    const parts = text.split('{{slika}}');
    const result: TextPart[] = [];

    parts.forEach((segment, index) => {
        if (segment !== '') {
            result.push({ type: 'text', value: segment });
        }
        if (index < parts.length - 1 && images[index]) {
            result.push({ type: 'image', uri: images[index] });
        }
    });
    return result;
}