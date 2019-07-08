export function applyStyleByElementName(elementName, styleKey, styleValue) {
  document.getElementsByTagName(elementName)[0].style[styleKey] = styleValue;
}

export function applyBlurToHeader() {
  applyStyleByElementName('header', 'filter', 'blur(5px)');
}

export function clearBlurFromHeader() {
  applyStyleByElementName('header', 'filter', '');
}
