document.addEventListener("DOMContentLoaded", () => {
  const textInput = document.getElementById("textInput");
  const submitBtn = document.getElementById("submitBtn");
  const textDisplay = document.getElementById("textDisplay");

  let selectedChars = [];
  let isDragging = false;
  let isSelectionBoxActive = false;
  let selectionBox = null;
  let startX, startY;
  let initialMouseX, initialMouseY;
  let initialPositions = [];

  // Function to check if two rectangles overlap
  function rectsOverlap(rect1, rect2) {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  }

  // Function to initialize characters on screen
  const initializeCharacters = (text) => {
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

      // Add mousedown event handler for each character
      charSpan.addEventListener("mousedown", (e) => {
        e.preventDefault();

        // If character is already selected, start dragging
        if (charSpan.classList.contains("selected")) {
          isDragging = true;
          initialMouseX = e.clientX;
          initialMouseY = e.clientY;
          initialPositions = selectedChars.map((char) => ({
            element: char,
            left: parseFloat(char.style.left),
            top: parseFloat(char.style.top),
            width: char.offsetWidth,
            height: char.offsetHeight,
          }));
        } else {
          // If character is not selected, reset previous selection (if Ctrl is not pressed)
          if (!e.ctrlKey) {
            selectedChars.forEach((char) => char.classList.remove("selected"));
            selectedChars = [];
          }

          // Add/remove selection for current character
          if (charSpan.classList.contains("selected")) {
            charSpan.classList.remove("selected");
            selectedChars = selectedChars.filter((char) => char !== charSpan);
          } else {
            charSpan.classList.add("selected");
            selectedChars.push(charSpan);
          }
        }
      });
    }
  };

  // Handler for "Submit" button click
  submitBtn.addEventListener("click", () => {
    const text = textInput.value;
    initializeCharacters(text);
  });

  // Handler for mousedown event on textDisplay container
  textDisplay.addEventListener("mousedown", (e) => {
    if (e.target === textDisplay) {
      isSelectionBoxActive = true;
      startX = e.clientX;
      startY = e.clientY;

      selectionBox = document.createElement("div");
      selectionBox.className = "selection-box";
      selectionBox.style.left = `${startX}px`;
      selectionBox.style.top = `${startY}px`;
      document.body.appendChild(selectionBox);

      // Reset previous selection (if Ctrl is not pressed)
      if (!e.ctrlKey) {
        selectedChars.forEach((char) => char.classList.remove("selected"));
        selectedChars = [];
      }
    }
  });

  // Handler for mousemove event on document
  document.addEventListener("mousemove", (e) => {
    if (isSelectionBoxActive && selectionBox) {
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

      // Check which characters fall within the selection area
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
    } else if (isDragging && selectedChars.length > 0) {
      const deltaX = e.clientX - initialMouseX;
      const deltaY = e.clientY - initialMouseY;

      // Just update positions while dragging without collision check
      for (const pos of initialPositions) {
        pos.element.style.left = `${pos.left + deltaX}px`;
        pos.element.style.top = `${pos.top + deltaY}px`;
      }
    }
  });

  // Handler for mouseup event on document
  document.addEventListener("mouseup", (e) => {
    if (isSelectionBoxActive && selectionBox) {
      isSelectionBoxActive = false;
      document.body.removeChild(selectionBox);
      selectionBox = null;
    }

    if (isDragging) {
      // When releasing dragged characters, check for character swaps
      const nonSelected = Array.from(
        document.querySelectorAll(".character")
      ).filter((char) => !selectedChars.includes(char));

      const deltaX = e.clientX - initialMouseX;
      const deltaY = e.clientY - initialMouseY;

      // Calculate final positions for selected characters
      const finalPositions = initialPositions.map((pos) => ({
        element: pos.element,
        left: pos.left + deltaX,
        top: pos.top + deltaY,
        width: pos.width,
        height: pos.height,
      }));

      // For each selected character, check if it overlaps with any non-selected character
      const swaps = [];

      finalPositions.forEach((selectedPos) => {
        const selectedRect = {
          left: selectedPos.left,
          top: selectedPos.top,
          right: selectedPos.left + selectedPos.width,
          bottom: selectedPos.top + selectedPos.height,
        };

        nonSelected.forEach((nonSelChar) => {
          const nonSelRect = {
            left: parseFloat(nonSelChar.style.left),
            top: parseFloat(nonSelChar.style.top),
            right: parseFloat(nonSelChar.style.left) + nonSelChar.offsetWidth,
            bottom: parseFloat(nonSelChar.style.top) + nonSelChar.offsetHeight,
          };

          if (rectsOverlap(selectedRect, nonSelRect)) {
            // Store the swap information
            swaps.push({
              selected: selectedPos.element,
              nonSelected: nonSelChar,
              selectedOriginalLeft:
                parseFloat(selectedPos.element.style.left) - deltaX,
              selectedOriginalTop:
                parseFloat(selectedPos.element.style.top) - deltaY,
              nonSelectedLeft: parseFloat(nonSelChar.style.left),
              nonSelectedTop: parseFloat(nonSelChar.style.top),
            });
          }
        });
      });

      // Process all swaps
      swaps.forEach((swap) => {
        // Move the non-selected character to the original position of the selected character
        swap.nonSelected.style.left = `${swap.selectedOriginalLeft}px`;
        swap.nonSelected.style.top = `${swap.selectedOriginalTop}px`;

        // The selected character stays where it was dropped (already positioned during drag)
        swap.selected.style.left = `${swap.nonSelectedLeft}px`;
        swap.selected.style.top = `${swap.nonSelectedTop}px`;
      });

      isDragging = false;
    }
  });
});
