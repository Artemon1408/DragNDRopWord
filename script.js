document.addEventListener("DOMContentLoaded", () => {
  const textDisplay = document.getElementById("text-display");
  const showTextBtn = document.getElementById("show-text-btn");

  const state = {
    isDragging: false,
    isSelecting: false,
    startX: 0,
    startY: 0,
    rectDiv: null,
    dragStartX: 0,
    dragStartY: 0,
    initialPositions: [],
    textDisplay,
  };

  showTextBtn.addEventListener("click", (e) => displayText(e, state));
  textDisplay.addEventListener("mousedown", handleMouseDown(state));
});

function displayText(e, state) {
  e.preventDefault();
  if (!state?.textDisplay) {
    console.error("Invalid state");
    return;
  }

  const input = document.getElementById("input-text");
  const text = input.value.trim();
  state.textDisplay.innerHTML = "";

  const fragment = document.createDocumentFragment();
  [...text].forEach((char) => {
    fragment.appendChild(createCharElement(char));
  });

  state.textDisplay.appendChild(fragment);
}

function createCharElement(char) {
  const span = document.createElement("span");
  span.className = "char";
  span.textContent = char;
  return span;
}

function handleMouseDown(state) {
  return (e) => {
    if (e.target.classList.contains("char")) {
      handleCharClick(e);
      startDragging(e, state);
    } else {
      startRectSelection(e, state);
    }
  };
}

function handleCharClick(e) {
  const char = e.target;
  const isMultiSelect = e.ctrlKey || e.metaKey;

  if (!isMultiSelect) {
    clearSelections();
  }

  char.classList.toggle(
    "selected",
    !isMultiSelect || !char.classList.contains("selected")
  );
}

function clearSelections() {
  document
    .querySelectorAll(".char.selected")
    .forEach((char) => char.classList.remove("selected"));
}

function startRectSelection(e, state) {
  if (e.ctrlKey) return;

  state.isSelecting = true;
  [state.startX, state.startY] = [e.clientX, e.clientY];

  state.rectDiv = document.createElement("div");
  state.rectDiv.className = "selection-rect";
  document.body.appendChild(state.rectDiv);

  document.addEventListener("mousemove", updateRect(state));
  document.addEventListener("mouseup", endRectSelection(state));
}

function updateRect(state) {
  return (e) => {
    if (!state.isSelecting) return;

    const { startX, startY, rectDiv } = state;
    const [currentX, currentY] = [e.clientX, e.clientY];

    rectDiv.style.left = `${Math.min(startX, currentX)}px`;
    rectDiv.style.top = `${Math.min(startY, currentY)}px`;
    rectDiv.style.width = `${Math.abs(currentX - startX)}px`;
    rectDiv.style.height = `${Math.abs(currentY - startY)}px`;
  };
}

function endRectSelection(state) {
  return (e) => {
    state.isSelecting = false;
    const { startX, startY, rectDiv } = state;
    const [endX, endY] = [e.clientX, e.clientY];

    const selectionBox = {
      left: Math.min(startX, endX),
      right: Math.max(startX, endX),
      top: Math.min(startY, endY),
      bottom: Math.max(startY, endY),
    };

    highlightCharsInSelection(selectionBox);
    cleanupRectSelection(state);
  };
}

function highlightCharsInSelection({ left, right, top, bottom }) {
  document.querySelectorAll(".char").forEach((char) => {
    const rect = char.getBoundingClientRect();
    const isInSelection = !(
      rect.right < left ||
      rect.left > right ||
      rect.bottom < top ||
      rect.top > bottom
    );

    if (isInSelection) char.classList.add("selected");
  });
}

function cleanupRectSelection({ rectDiv }) {
  document.body.removeChild(rectDiv);
  document.removeEventListener("mousemove", updateRect);
  document.removeEventListener("mouseup", endRectSelection);
}

function startDragging(e, state) {
  if (!e.target.classList.contains("selected")) return;

  state.isDragging = true;
  [state.dragStartX, state.dragStartY] = [e.clientX, e.clientY];

  const { textDisplay } = state;
  state.initialPositions = getInitialPositions(textDisplay);

  setupDraggableElements();
  document.addEventListener("mousemove", drag(state));
  document.addEventListener("mouseup", stopDragging(state));
}

function getInitialPositions(container) {
  return [...document.querySelectorAll(".char.selected")].map((char) => {
    const rect = char.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return {
      element: char,
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
    };
  });
}

function setupDraggableElements() {
  document.querySelectorAll(".char.selected").forEach((char) => {
    Object.assign(char.style, {
      position: "absolute",
      left: `${char.offsetLeft}px`,
      top: `${char.offsetTop}px`,
    });
  });
}

function drag(state) {
  return (e) => {
    if (!state.isDragging) return;

    const deltaX = e.clientX - state.dragStartX;
    const deltaY = e.clientY - state.dragStartY;

    state.initialPositions.forEach(({ element, x, y }) => {
      element.style.left = `${x + deltaX}px`;
      element.style.top = `${y + deltaY}px`;
    });
  };
}

function stopDragging(state) {
  return () => {
    state.isDragging = false;

    document.querySelectorAll(".char.selected").forEach((char) => {
      handleElementDrop(char);
      resetElementPosition(char);
    });

    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", stopDragging);
  };
}

function handleElementDrop(draggedChar) {
  const draggedRect = draggedChar.getBoundingClientRect();

  document.querySelectorAll(".char:not(.selected)").forEach((otherChar) => {
    const otherRect = otherChar.getBoundingClientRect();

    if (elementsOverlap(draggedRect, otherRect)) {
      swapElements(draggedChar, otherChar);
    }
  });
}

function elementsOverlap(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

function swapElements(el1, el2) {
  const parent = el1.parentNode;
  const temp = document.createElement("div");

  parent.insertBefore(temp, el2);
  parent.insertBefore(el2, el1);
  parent.insertBefore(el1, temp);
  parent.removeChild(temp);
}

function resetElementPosition(element) {
  Object.assign(element.style, {
    position: "",
    left: "",
    top: "",
  });
}
