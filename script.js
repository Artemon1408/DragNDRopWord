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

  // Відображення тексту
  submitBtn.addEventListener("click", () => {
    const text = textInput.value;
    textDisplay.innerHTML = "";
    selectedChars = [];

    // Створення елементів для кожного символу
    for (let i = 0; i < text.length; i++) {
      const charSpan = document.createElement("span");
      charSpan.className = "character";
      charSpan.textContent = text[i];
      charSpan.setAttribute("data-index", i);
      textDisplay.appendChild(charSpan);

      // Обробник кліку для виділення символів
      charSpan.addEventListener("mousedown", (e) => {
        if (!e.ctrlKey) {
          // Якщо Ctrl не натиснутий, зняти всі виділення
          if (!charSpan.classList.contains("selected")) {
            selectedChars.forEach((char) => char.classList.remove("selected"));
            selectedChars = [];
          }
        }

        if (charSpan.classList.contains("selected")) {
          // Якщо ми клікаємо на вже виділений символ, готуємося до перетягування групи
          if (selectedChars.length > 1) {
            isMovingSelectedGroup = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
          }
        } else {
          charSpan.classList.add("selected");
          selectedChars.push(charSpan);
        }

        // Почати перетягування, якщо символ виділений
        if (charSpan.classList.contains("selected")) {
          isDragging = true;
          e.preventDefault(); // Запобігти початку селекції тексту
        }
      });

      // Обробник для визначення, чи символ може бути ціллю для переміщення
      charSpan.addEventListener("mouseover", (e) => {
        if (isDragging && selectedChars.length > 0) {
          if (!selectedChars.includes(charSpan)) {
            targetDropPosition = charSpan;

            // Прибрати виділення з усіх потенційних цілей
            document.querySelectorAll(".character").forEach((c) => {
              if (!selectedChars.includes(c)) {
                c.style.backgroundColor = "";
              }
            });

            // Підсвітити поточну ціль
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

    // Створення прямокутника виділення
    textDisplay.addEventListener("mousedown", (e) => {
      // Переконатися, що клік не на символі
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

        // Якщо Ctrl не натиснутий, зняти всі виділення
        if (!e.ctrlKey) {
          selectedChars.forEach((char) => char.classList.remove("selected"));
          selectedChars = [];
        }
      }
    });

    // Обробка руху миші
    document.addEventListener("mousemove", (e) => {
      if (isDragging && selectedChars.length > 0) {
        // Логіка перетягування символів
        selectedChars.forEach((char) => {
          if (!char.classList.contains("dragging")) {
            char.classList.add("dragging");
          }
        });
      } else if (isSelectionBoxActive && selectionBox) {
        // Оновлення розміру і позиції прямокутника виділення
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

        // Виділення символів в прямокутнику
        document.querySelectorAll(".character").forEach((char) => {
          const charRect = char.getBoundingClientRect();

          // Перевірка, чи символ в межах прямокутника
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
            // Якщо символ не в прямокутнику і не було натиснуто Ctrl, зняти виділення
            char.classList.remove("selected");
            selectedChars = selectedChars.filter((c) => c !== char);
          }
        });
      }
    });

    // Закінчення дій миші
    document.addEventListener("mouseup", (e) => {
      // Виконати переміщення виділених символів, якщо є ціль
      if (isDragging && selectedChars.length > 0 && targetDropPosition) {
        // Видалити клас перетягування
        selectedChars.forEach((char) => {
          char.classList.remove("dragging");
        });

        // Очистити фон цілі
        if (targetDropPosition) {
          targetDropPosition.style.backgroundColor = "";
        }

        // Переміщення виділених символів до цілі
        const parent = textDisplay;
        const target = targetDropPosition;

        // Сортування виділених символів за їх порядком у DOM
        const sortedSelection = [...selectedChars].sort((a, b) => {
          const aIndex = Array.from(parent.children).indexOf(a);
          const bIndex = Array.from(parent.children).indexOf(b);
          return aIndex - bIndex;
        });

        // Визначення порядку вставки
        const targetIndex = Array.from(parent.children).indexOf(target);

        // Переміщення всіх виділених елементів після цілі
        sortedSelection.forEach((selected) => {
          // Вставити перед цільовим елементом
          parent.insertBefore(selected, target);
        });

        // Після переміщення оновити порядок символів у рядку
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

    // Функція для оновлення порядку символів після переміщення
    function rearrangeText() {
      const charElements = Array.from(
        textDisplay.querySelectorAll(".character")
      );

      // Оновити атрибути data-index для всіх символів
      charElements.forEach((char, index) => {
        char.setAttribute("data-index", index);
      });
    }
  });
});
