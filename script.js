document.addEventListener("DOMContentLoaded", () => {
  const textInput = document.getElementById("textInput");
  const submitBtn = document.getElementById("submitBtn");
  const textDisplay = document.getElementById("textDisplay");

  let selectedChars = [];
  let isDragging = false;
  let isSelectionBoxActive = false;
  let selectionBox = null;
  let startX, startY;
  let dragStartX, dragStartY;
  let isMovingSelectedGroup = false;
  let targetDropPosition = null;

  submitBtn.addEventListener("click", () => {
    const text = textInput.value;
    textDisplay.innerHTML = "";
    selectedChars = [];

    for (let i = 0; i < text.length; i++) {
      const charSpan = document.createElement("span");
      charSpan.className = "character";
      charSpan.textContent = text[i];
      charSpan.setAttribute("data-index", i);
      textDisplay.appendChild(charSpan);

      charSpan.addEventListener("mousedown", (e) => {
        if (!e.ctrlKey) {
          if (!charSpan.classList.contains("selected")) {
            selectedChars.forEach((char) => char.classList.remove("selected"));
            selectedChars = [];
          }
        }

        if (charSpan.classList.contains("selected")) {
          if (selectedChars.length > 1) {
            isMovingSelectedGroup = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
          }
        } else {
          charSpan.classList.add("selected");
          selectedChars.push(charSpan);
        }

        if (charSpan.classList.contains("selected")) {
          isDragging = true;
          e.preventDefault();
        }
      });

      charSpan.addEventListener("mouseover", (e) => {
        if (isDragging && selectedChars.length > 0) {
          if (!selectedChars.includes(charSpan)) {
            targetDropPosition = charSpan;

            document.querySelectorAll(".character").forEach((c) => {
              if (!selectedChars.includes(c)) {
                c.style.backgroundColor = "";
              }
            });

            charSpan.style.backgroundColor = "lightblue";
          }
        }
      });

      charSpan.addEventListener("mouseout", () => {
        if (isDragging && charSpan.style.backgroundColor === "lightblue") {
          charSpan.style.backgroundColor = "";
        }
      });
    }

    textDisplay.addEventListener("mousedown", (e) => {
      if (e.target === textDisplay) {
        isSelectionBoxActive = true;
        startX = e.clientX;
        startY = e.clientY;

        selectionBox = document.createElement("div");
        selectionBox.className = "selection-box";
        selectionBox.style.left = `${
          e.clientX - textDisplay.getBoundingClientRect().left
        }px`;
        selectionBox.style.top = `${
          e.clientY - textDisplay.getBoundingClientRect().top
        }px`;
        selectionBox.style.width = "0px";
        selectionBox.style.height = "0px";
        textDisplay.appendChild(selectionBox);

        if (!e.ctrlKey) {
          selectedChars.forEach((char) => char.classList.remove("selected"));
          selectedChars = [];
        }
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging && selectedChars.length > 0) {
        selectedChars.forEach((char) => {
          if (!char.classList.contains("dragging")) {
            char.classList.add("dragging");
          }
        });
      } else if (isSelectionBoxActive && selectionBox) {
        const currentX = e.clientX;
        const currentY = e.clientY;
        const displayRect = textDisplay.getBoundingClientRect();

        const left = Math.min(startX, currentX) - displayRect.left;
        const top = Math.min(startY, currentY) - displayRect.top;
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;

        document.querySelectorAll(".character").forEach((char) => {
          const charRect = char.getBoundingClientRect();

          if (
            charRect.left >= Math.min(startX, currentX) &&
            charRect.right <= Math.max(startX, currentX) &&
            charRect.top >= Math.min(startY, currentY) &&
            charRect.bottom <= Math.max(startY, currentY)
          ) {
            if (!char.classList.contains("selected")) {
              char.classList.add("selected");
              selectedChars.push(char);
            }
          } else if (
            !e.ctrlKey &&
            selectedChars.indexOf(char) >= 0 &&
            selectedChars.length > 0 &&
            (isSelectionBoxActive || !isDragging)
          ) {
            char.classList.remove("selected");
            selectedChars = selectedChars.filter((c) => c !== char);
          }
        });
      }
    });

    document.addEventListener("mouseup", (e) => {
      if (isDragging && selectedChars.length > 0 && targetDropPosition) {
        selectedChars.forEach((char) => {
          char.classList.remove("dragging");
        });

        if (targetDropPosition) {
          targetDropPosition.style.backgroundColor = "";
        }

        const parent = textDisplay;
        const target = targetDropPosition;

        const sortedSelection = [...selectedChars].sort((a, b) => {
          const aIndex = Array.from(parent.children).indexOf(a);
          const bIndex = Array.from(parent.children).indexOf(b);
          return aIndex - bIndex;
        });

        const targetIndex = Array.from(parent.children).indexOf(target);

        sortedSelection.forEach((selected) => {
          parent.insertBefore(selected, target);
        });

        rearrangeText();
      }

      isDragging = false;
      isMovingSelectedGroup = false;
      targetDropPosition = null;

      if (isSelectionBoxActive && selectionBox) {
        isSelectionBoxActive = false;
        textDisplay.removeChild(selectionBox);
        selectionBox = null;
      }
    });

    function rearrangeText() {
      const charElements = Array.from(
        textDisplay.querySelectorAll(".character")
      );

      charElements.forEach((char, index) => {
        char.setAttribute("data-index", index);
      });
    }
  });
});
