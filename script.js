document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#schedule-table tbody');
    const clearButton = document.getElementById('clear-button');
    const activityItems = document.querySelectorAll('.activity-item'); // Seleccionar todos los items arrastrables
    const startTime = 6; // 06:00
    const endTime = 22; // Hasta las 22:00 (última fila 22:00 - 22:30)
    const interval = 30; // 30 minutos

    // --- Generar las filas de la tabla dinámicamente ---
    function generateTableRows() {
        tableBody.innerHTML = ''; // Limpiar tabla antes de generar
        for (let hour = startTime; hour <= endTime; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                // Condición para detener la generación en la última fila deseada (22:00 - 22:30)
                if (hour === endTime && minute >= interval) break; // Evita generar filas después de las 22:00

                const formattedHour = hour.toString().padStart(2, '0');
                const formattedMinute = minute.toString().padStart(2, '0');
                let nextHour = hour;
                let nextMinute = minute + interval;

                if (nextMinute >= 60) {
                    nextHour++;
                    nextMinute = 0;
                }

                const formattedNextHour = nextHour.toString().padStart(2, '0');
                const formattedNextMinute = nextMinute.toString().padStart(2, '0');
                const timeLabel = `${formattedHour}:${formattedMinute} - ${formattedNextHour}:${formattedNextMinute}`;

                const row = document.createElement('tr');
                const timeCell = document.createElement('th');
                timeCell.scope = "row";
                timeCell.textContent = timeLabel;
                row.appendChild(timeCell);

                const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                days.forEach(day => {
                    const dataCell = document.createElement('td');
                    dataCell.dataset.time = timeLabel; // Guardar la hora
                    dataCell.dataset.day = day;       // Guardar el día
                    row.appendChild(dataCell);
                });
                tableBody.appendChild(row);
            }
        }
         // Si endTime es 22, la última fila generada debe ser 22:00 - 22:30
         // Asegurémonos que exista si no se creó por el break anterior
         if (endTime === 22 && !tableBody.querySelector('td[data-time="20:00 - 20:30"]')) {
             const formattedHour = endTime.toString().padStart(2, '0');
             const formattedMinute = '00';
             const formattedNextHour = endTime.toString().padStart(2, '0');
             const formattedNextMinute = interval.toString().padStart(2, '0');
             const timeLabel = `${formattedHour}:${formattedMinute} - ${formattedNextHour}:${formattedNextMinute}`;

             const row = document.createElement('tr');
             const timeCell = document.createElement('th');
             timeCell.scope = "row";
             timeCell.textContent = timeLabel;
             row.appendChild(timeCell);
             const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
             days.forEach(day => {
                 const dataCell = document.createElement('td');
                 dataCell.dataset.time = timeLabel;
                 dataCell.dataset.day = day;
                 row.appendChild(dataCell);
             });
             tableBody.appendChild(row);
         }
    }


    // --- Función para manejar el clic en una celda (para editar/añadir manualmente) ---
    function handleCellClick(event) {
        // Asegurarse de que se hizo clic en una celda TD (no en la cabecera de hora TH)
        if (event.target.tagName === 'TD') {
            const cell = event.target;
            const currentActivity = cell.textContent;
            // Usar prompt para simplicidad, se podría reemplazar por un modal más adelante
            const newActivity = prompt(`Actividad para ${cell.dataset.day} (${cell.dataset.time}):`, currentActivity);

            // Si el usuario presiona "Aceptar" (incluso si está vacío para borrar)
            if (newActivity !== null) {
                cell.textContent = newActivity.trim(); // Actualizar celda
                saveData(); // Guardar cambios en localStorage
            }
            // Si presiona "Cancelar", no hacer nada
        }
    }

    // --- Función para limpiar todo el planificador ---
    function clearSchedule() {
        if (confirm('¿Estás seguro de que quieres borrar TODAS las actividades del planificador? Esta acción no se puede deshacer.')) {
            const dataCells = tableBody.querySelectorAll('td');
            dataCells.forEach(cell => {
                cell.textContent = ''; // Limpiar visualmente
            });
            localStorage.removeItem('timeBlockSchedule'); // Limpiar datos guardados
            console.log('Planificador limpiado y datos eliminados de localStorage.');
        }
    }

    // --- Guardado/Carga con LocalStorage ---
    function saveData() {
        const scheduleData = {};
        const dataCells = tableBody.querySelectorAll('td');
        dataCells.forEach(cell => {
            // Crear una clave única para cada celda: Dia-HoraInicio-HoraFin
            const key = `${cell.dataset.day}-${cell.dataset.time.replace(/\s/g, '')}`; // Quitar espacios de la hora para la clave
            if (cell.textContent.trim() !== '') {
                scheduleData[key] = cell.textContent.trim(); // Guardar solo si no está vacía
            }
        });
        try {
            localStorage.setItem('timeBlockSchedule', JSON.stringify(scheduleData));
             console.log('Datos guardados en localStorage.');
        } catch (e) {
            console.error("Error al guardar en localStorage:", e);
            // Podrías notificar al usuario que el almacenamiento falló (ej. cuota excedida)
        }
    }

    function loadData() {
        const savedData = localStorage.getItem('timeBlockSchedule');
        if (savedData) {
            try {
                const scheduleData = JSON.parse(savedData);
                const dataCells = tableBody.querySelectorAll('td');
                dataCells.forEach(cell => {
                    const key = `${cell.dataset.day}-${cell.dataset.time.replace(/\s/g, '')}`;
                    if (scheduleData[key]) {
                        cell.textContent = scheduleData[key]; // Cargar contenido guardado
                    } else {
                        cell.textContent = ''; // Asegurar que celdas sin datos estén vacías
                    }
                });
                console.log('Datos cargados de localStorage.');
            } catch (e) {
                 console.error("Error al cargar o parsear datos de localStorage:", e);
                 // Podrías limpiar el storage si los datos están corruptos
                 // localStorage.removeItem('timeBlockSchedule');
            }
        } else {
            console.log('No se encontraron datos guardados en localStorage.');
        }
    }

    // --- Lógica de Drag and Drop ---

    let draggedItemText = null; // Variable para guardar el texto del item arrastrado

    // 1. Listeners para los items arrastrables (en la barra lateral)
    activityItems.forEach(item => {
        item.addEventListener('dragstart', (event) => {
            // Guardar el texto de la actividad
            draggedItemText = event.target.textContent;
            event.dataTransfer.effectAllowed = 'copy'; // Indicar visualmente que es una copia
            event.target.style.opacity = '0.5'; // Opcional: Hacer el item semi-transparente mientras se arrastra
            console.log(`Iniciando arrastre de: ${draggedItemText}`);
        });

        item.addEventListener('dragend', (event) => {
            // Limpiar estilos al finalizar el arrastre (incluso si no se soltó en un lugar válido)
            event.target.style.opacity = '1';
            draggedItemText = null; // Limpiar la variable
             console.log(`Finalizando arrastre`);
             // Quitar clases 'drag-over' de todas las celdas por si acaso
             tableBody.querySelectorAll('.drag-over').forEach(cell => cell.classList.remove('drag-over'));
        });
    });

    // 2. Listeners para las celdas de la tabla (zona de drop) usando delegación en tbody
    tableBody.addEventListener('dragover', (event) => {
        // Necesario para permitir el drop
        event.preventDefault();
        // Asegurarse de que el target es una celda TD
        if (event.target.tagName === 'TD') {
            event.dataTransfer.dropEffect = 'copy'; // Cursor indica que se puede copiar
            event.target.classList.add('drag-over'); // Añadir clase para feedback visual
        } else {
             event.dataTransfer.dropEffect = 'none'; // No permitir soltar fuera de un TD
        }
    });

    tableBody.addEventListener('dragenter', (event) => {
        // Añadir feedback visual cuando entra a una celda válida
        if (event.target.tagName === 'TD') {
            event.target.classList.add('drag-over');
        }
    });

    tableBody.addEventListener('dragleave', (event) => {
        // Quitar feedback visual cuando sale de una celda
        if (event.target.tagName === 'TD') {
            event.target.classList.remove('drag-over');
        }
    });

    tableBody.addEventListener('drop', (event) => {
        event.preventDefault(); // Prevenir comportamiento por defecto
        if (event.target.tagName === 'TD' && draggedItemText) {
            const cell = event.target;
            cell.classList.remove('drag-over'); // Quitar feedback visual
            // Actualizar el contenido de la celda con el texto guardado
            cell.textContent = draggedItemText;
            console.log(`Soltado: ${draggedItemText} en ${cell.dataset.day} ${cell.dataset.time}`);
            // Guardar los cambios en localStorage
            saveData();
        }
        // Limpiar variable global por si acaso (aunque dragend también lo hace)
         draggedItemText = null;
    });

    // --- Inicialización de la página ---
    generateTableRows(); // 1. Crear la estructura de la tabla
    loadData();          // 2. Cargar datos previamente guardados en las celdas
                         //    (Debe hacerse DESPUÉS de crear las celdas)

    // 3. Añadir listeners para interacciones
    tableBody.addEventListener('click', handleCellClick); // Para editar/añadir manualmente
    clearButton.addEventListener('click', clearSchedule); // Para el botón de limpiar

    console.log("Planificador inicializado.");

}); // Fin del DOMContentLoaded