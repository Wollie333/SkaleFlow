/**
 * Returns the pixel position of the text caret inside a textarea or input element.
 * Creates a hidden mirror div with matching styles to measure the position.
 */
export function getCaretCoordinates(
  element: HTMLTextAreaElement | HTMLInputElement,
  position: number
): { top: number; left: number; height: number } {
  const isTextarea = element.tagName === 'TEXTAREA';
  const div = document.createElement('div');
  div.id = 'caret-mirror';
  document.body.appendChild(div);

  const computed = window.getComputedStyle(element);
  const props = [
    'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'borderStyle', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
    'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
    'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing',
    'tabSize', 'whiteSpace',
  ] as const;

  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.overflow = 'hidden';
  div.style.whiteSpace = isTextarea ? 'pre-wrap' : 'pre';
  div.style.wordWrap = isTextarea ? 'break-word' : 'normal';

  for (const prop of props) {
    (div.style as unknown as Record<string, string>)[prop] = computed.getPropertyValue(
      prop.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)
    );
  }

  div.textContent = element.value.substring(0, position);

  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);

  const result = {
    top: span.offsetTop + parseInt(computed.borderTopWidth) - element.scrollTop,
    left: span.offsetLeft + parseInt(computed.borderLeftWidth) - element.scrollLeft,
    height: parseInt(computed.lineHeight) || parseInt(computed.fontSize) * 1.2,
  };

  document.body.removeChild(div);
  return result;
}
