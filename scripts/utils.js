export function CreateElem(type, className, id, text) {
  const elem = document.createElement(type);
  if (className) elem.className = className;
  if (id) elem.id = id;
  if (text) elem.textContent = text;
  return elem;
}
