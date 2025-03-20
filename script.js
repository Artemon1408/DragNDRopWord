document.addEventListener("DOMContentLoaded", () => {
  const textInput = document.getElementById("textInput");
  const submitBtn = document.getElementById("submitBtn");
  const textDisplay = document.getElementById("textDisplay");

  let selectedChars = [];
  let isDragging = false;
  let draggedElement = null;
  let isSelectionBoxActive = false;
  let selectionBox = null;
  let startX, startY;
  let initialMouseX, initialMouseY;
  let initialPositions = [];
  let swapTarget = null;

  submitBtn.addEventListener("click", () => {
    const text = textInput.value;
    textDisplay.innerHTML = "";
    selectedChars = [];

    let leftPosition = 10;
    let topPosition = 20;
    const lineHeight = 30;
    const maxWidth = textDisplay.offsetWidth - 50;

    for (let i = 0; i < text.length; i++) {
      const charSpan = document.createElement("span");
      charSpan.className = "character";
      charSpan.textContent = text[i];
      charSpan.setAttribute("data-index", i);

      if (leftPosition > maxWidth) {
        leftPosition = 10;
        topPosition += lineHeight;
      }

      charSpan.style.left = `${leftPosition}px`;
      charSpan.style.top = `${topPosition}px`;
      textDisplay.appendChild(charSpan);

      leftPosition += 20;

      charSpan.addEventListener("mousedown", (e) => {
        e.preventDefault();

        if (!e.ctrlKey && !charSpan.classList.contains("selected")) {
          selectedChars.forEach((char) => char.classList.remove("selected"));
          selectedChars = [];
        }

        if (charSpan.classList.contains("selected")) {
          charSpan.classList.remove("selected");
          selectedChars = selectedChars.filter((char) => char !== charSpan);
        } else {
          charSpan.classList.add("selected");
          selectedChars.push(charSpan);
        }

        if (charSpan.classList.contains("selected")) {
          isDragging = true;
          draggedElement = charSpan;

          draggedElement.dataset.originalLeft = draggedElement.style.left;
          draggedElement.dataset.originalTop = draggedElement.style.top;

          initialMouseX = e.clientX;
          initialMouseY = e.clientY;

          initialPositions = selectedChars.map((char) => ({
            element: char,
            left: parseFloat(char.style.left),
            top: parseFloat(char.style.top),
          }));
        }

        e.stopPropagation();
      });
    }

    textDisplay.addEventListener("mousedown", (e) => {
      if (e.target === textDisplay) {
        isSelectionBoxActive = true;
        startX = e.clientX;
        startY = e.clientY;

        selectionBox = document.createElement("div");
        selectionBox.className = "selection-box";
        selectionBox.style.left = `${e.clientX}px`;
        selectionBox.style.top = `${e.clientY}px`;
        selectionBox.style.width = "0px";
        selectionBox.style.height = "0px";
        document.body.appendChild(selectionBox);

        if (!e.ctrlKey) {
          selectedChars.forEach((char) => char.classList.remove("selected"));
          selectedChars = [];
        }
      }
    });
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging && selectedChars.length > 0) {
      const deltaX = e.clientX - initialMouseX;
      const deltaY = e.clientY - initialMouseY;

      initialPositions.forEach((pos) => {
        pos.element.style.left = `${pos.left + deltaX}px`;
        pos.element.style.top = `${pos.top + deltaY}px`;
      });

      if (selectedChars.length === 1) {
        swapTarget = null;
        document.querySelectorAll(".character").forEach((char) => {
          if (char === draggedElement) return;

          const rect = char.getBoundingClientRect();
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            char.style.backgroundColor = "lightblue";
            swapTarget = char;
          } else {
            char.style.backgroundColor = "";
          }
        });
      }
    } else if (isSelectionBoxActive && selectionBox) {
      const currentX = e.clientX;
      const currentY = e.clientY;

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      selectionBox.style.left = `${left}px`;
      selectionBox.style.top = `${top}px`;
      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;

      const selectionRect = {
        left: left,
        top: top,
        right: left + width,
        bottom: top + height,
      };

      document.querySelectorAll(".character").forEach((char) => {
        const charRect = char.getBoundingClientRect();

        const overlap = !(
          charRect.right < selectionRect.left ||
          charRect.left > selectionRect.right ||
          charRect.bottom < selectionRect.top ||
          charRect.top > selectionRect.bottom
        );

        if (overlap) {
          if (!char.classList.contains("selected")) {
            char.classList.add("selected");
            selectedChars.push(char);
          }
        } else if (!e.ctrlKey && selectedChars.includes(char)) {
          char.classList.remove("selected");
          selectedChars = selectedChars.filter((c) => c !== char);
        }
      });
    }
  });

  document.addEventListener("mouseup", (e) => {
    if (isDragging && selectedChars.length === 1 && swapTarget) {
      const targetLeft = swapTarget.style.left;
      const targetTop = swapTarget.style.top;

      swapTarget.style.left = draggedElement.dataset.originalLeft;
      swapTarget.style.top = draggedElement.dataset.originalTop;

      draggedElement.style.left = targetLeft;
      draggedElement.style.top = targetTop;

      swapTarget.style.backgroundColor = "";
    }

    selectedChars.forEach((char) => {
      char.dataset.originalLeft = char.style.left;
      char.dataset.originalTop = char.style.top;
    });

    isDragging = false;
    draggedElement = null;
    swapTarget = null;
    initialPositions = [];

    if (isSelectionBoxActive && selectionBox) {
      isSelectionBoxActive = false;
      document.body.removeChild(selectionBox);
      selectionBox = null;
    }
  });
});
