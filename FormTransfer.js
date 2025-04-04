// Helper function to get a unique, deterministic identifier for a field instance
// Accepts the container element (e.g., a div containing the form fields) and the field element.
function getFieldInstanceIdentifier(containerElement, fieldElement) {
    // Use containerElement consistently
    if (!containerElement || !fieldElement) {
        console.error("getFieldInstanceIdentifier: Missing container or field element.");
        return null;
    }

    const fieldName = fieldElement.name || fieldElement.id;
    if (!fieldName) {
        // Skip fields without a name or ID, as they cannot be reliably identified.
        return null;
    }

    // 1. Get all potentially relevant fields within the specific form.
    const allFieldsInForm = Array.from(containerElement.querySelectorAll('input, select, textarea'));

    // 2. Filter to find fields with the *exact* same name or ID.
    //    Manual filtering avoids potential issues with complex CSS selectors.
    const fieldsWithSameName = allFieldsInForm.filter(field =>
        !isIgnoredInput(field) && (field.name === fieldName || field.id === fieldName)
    );

    // 3. Find the index of the *current* fieldElement within this filtered list.
    const index = fieldsWithSameName.indexOf(fieldElement);

    // 4. Construct the identifier (e.g., "fieldName_0", "fieldName_1").
    //    If the index is -1 (which implies fieldElement wasn't found in its own group,
    //    shouldn't happen if the logic is correct), return null.
    return index !== -1 ? `${fieldName}_${index}` : null;
}


// Extracts form data from a specified container element.
function extractFormData(containerElement) {
    if (!containerElement) {
        console.error("extractFormData: Container element not provided.");
        return null;
    }

    const formData = {};
    const formInputs = containerElement.querySelectorAll('input, select, textarea');

    formInputs.forEach(inputElement => {
        if (isIgnoredInput(inputElement)) {
            return; // Skip ignored inputs
        }

        // Pass the containerElement to the identifier function
        const identifier = getFieldInstanceIdentifier(containerElement, inputElement);
        if (!identifier) return; // Skip if identifier couldn't be generated or field is irrelevant

        // Handle different input types
        const inputType = inputElement.type;
        const baseName = inputElement.name || inputElement.id; // Used for grouping radios/checkboxes

        if (inputType === 'checkbox') {
             // For checkboxes, store an array if multiple have the same identifier base
             // This handles checkbox groups correctly even with unique identifiers
             if (!formData[baseName]) {
                 formData[baseName] = [];
             }
             if (inputElement.checked) {
                 formData[baseName].push(inputElement.value || 'on'); // Store value if checked
             }
             // Note: The unique identifier helps distinguish *which* checkbox group instance,
             // but standard handling often relies on the shared name. We store under base name.
             // If distinguishing individual checkboxes within a group instance is critical,
             // the identifier could be used directly: formData[identifier] = input.checked;
        } else if (inputType === 'radio') {
            // For radio buttons, only store the value of the selected one per group name
           if (inputElement.checked) {
                formData[baseName] = inputElement.value;
            } else if (formData[baseName] === undefined) {
                // Ensure the key exists even if none are checked initially
                formData[baseName] = null;
            }
             // Similar to checkboxes, standard handling uses the shared name.
             // If distinguishing radio groups instances is needed:
             // if (inputElement.checked) { formData[identifier] = inputElement.value; }
        } else if (inputType === 'file') {
            // Files cannot be easily serialized directly to JSON
            formData[identifier] = `File: ${inputElement.files.length > 0 ? inputElement.files[0].name : 'No file selected'}`; // Store filename or indicator
        } else if (inputElement.multiple && inputElement.tagName === 'SELECT') {
            // Handle multi-select
            formData[identifier] = Array.from(inputElement.selectedOptions).map(option => option.value);
        }
         else {
             // Default case for text, password, hidden, select-one, textarea, etc.
            formData[identifier] = inputElement.value;
        }
    });

    return formData;
}

// Saves the provided data object as a JSON file.
function saveAsJson(data, filename = 'form_data.json') { // Add filename parameter
    if (!data) {
        console.error("saveAsJson: No data provided to save.");
        return;
    }
    const jsonString = JSON.stringify(data, null, 2); // Pretty print JSON
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename; // Use the provided filename
    
    // Add the link to the document and click it automatically
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Clean up
    document.body.removeChild(downloadLink); // Clean up the link
    URL.revokeObjectURL(url); // Clean up the object URL

    console.log(`Form data saved successfully as ${filename}! To fill another form, navigate to the desired page and click the 'Load and Fill Form' button.`);
}

// Prompts the user to load a JSON file using a UI modal.
function loadJsonFile() {
    return new Promise((resolve, reject) => {
        // Create the modal overlay div
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '10000';
        
        // Create the content panel inside the modal
        const panel = document.createElement('div');
        panel.style.backgroundColor = '#fff';
        panel.style.padding = '20px';
        panel.style.borderRadius = '5px';
        panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
        panel.style.maxWidth = '500px';
        panel.style.width = '80%';
        
        const title = document.createElement('h3');
        title.textContent = 'Select the JSON file with the form data';
        title.style.marginTop = '0';
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'block';
        fileInput.style.margin = '20px 0';
        fileInput.style.width = '100%';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.marginRight = '10px';
        cancelButton.style.padding = '8px 16px';
        cancelButton.style.backgroundColor = '#f44336';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '4px';
        cancelButton.style.cursor = 'pointer';
        
        const loadButton = document.createElement('button');
        loadButton.textContent = 'Load';
        loadButton.style.padding = '8px 16px';
        loadButton.style.backgroundColor = '#4CAF50';
        loadButton.style.color = 'white';
        loadButton.style.border = 'none';
        loadButton.style.borderRadius = '4px';
        loadButton.style.cursor = 'pointer';
        loadButton.disabled = true;
        
        // Enable load button only when a file is chosen
        fileInput.addEventListener('change', () => {
            loadButton.disabled = !fileInput.files.length;
        });
        
        cancelButton.onclick = () => {
            document.body.removeChild(modal);
            console.log("File load operation cancelled by user.");
            reject("User cancelled the operation"); // Reject promise on cancel
        };
        
        loadButton.onclick = () => {
            const file = fileInput.files[0];
            if (!file) {
                console.warn("Please select a JSON file.");
                // Optionally show a message in the modal itself
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    document.body.removeChild(modal);
                    resolve(jsonData);
                } catch (error) {
                    console.error("Error parsing JSON file:", error.message);
                    // Optionally show error in modal
                }
            };
            reader.onerror = () => {
                console.error("Error reading file.");
                document.body.removeChild(modal);
                reject("Error reading file");
            };
            reader.readAsText(file);
        };
        
        // Assemble the modal's DOM structure
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(loadButton);
        
        panel.appendChild(title);
        panel.appendChild(fileInput);
        panel.appendChild(buttonContainer);
        
        modal.appendChild(panel);
        document.body.appendChild(modal);
        
        // Add event listener to close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                reject("Operation cancelled by user");
            }
        });
    });
}

// Fills form fields within a container element using provided data.
function fillFormWithJson(containerElement, formData) { // Rename data to formData
    if (!containerElement) {
        console.error("fillFormWithJson: Container element not provided.");
        return;
    }
    if (!formData) { // Check formData
        console.error("fillFormWithJson: formData not provided.");
        return;
    }

    const formInputs = containerElement.querySelectorAll('input, select, textarea'); // Use containerElement

    formInputs.forEach(inputElement => {
        if (isIgnoredInput(inputElement)) {
            return; // Skip ignored inputs
        }

        // Pass the containerElement to the identifier function
        const identifier = getFieldInstanceIdentifier(containerElement, inputElement);
        const originalName = inputElement.name || inputElement.id; // Needed for radio/checkbox group logic
        const inputType = inputElement.type;

        if (identifier && formData.hasOwnProperty(identifier)) {
            // Handle fields identified uniquely (most common case)
            const value = formData[identifier];

            if (inputType === 'checkbox') {
                // Simple checked state based on unique ID (if stored that way)
                 inputElement.checked = !!value;
                 // If formData was stored per group (array of values), this needs adjustment
                 // Example: if (formData[originalName] && formData[originalName].includes(inputElement.value)) { inputElement.checked = true; }
            } else if (inputType === 'radio') {
                 // Simple check based on unique ID (if stored that way)
                 if (inputElement.value === value) {
                     inputElement.checked = true;
                 }
                 // If formData was stored per group:
                 // Example: if (formData[originalName] === inputElement.value) { inputElement.checked = true; }
            } else if (inputType !== 'file') { // Ignore file inputs during filling
                 if (inputElement.multiple && inputElement.tagName === 'SELECT') {
                     // Handle multi-select specifically
                     if (Array.isArray(value)) { // Ensure data is an array
                         const valuesSet = new Set(value); // Use Set for efficient lookup
                         Array.from(inputElement.options).forEach(option => {
                             option.selected = valuesSet.has(option.value);
                         });
                     } else {
                         console.warn(`Expected array for multi-select '${identifier}', but got:`, value);
                         // Log a warning and don't change selection if formData is wrong type.
                     }
                 } else {
                    // Handle single-value fields
                    inputElement.value = value;
                 }

                // Dispatch events to trigger potential validation or framework updates
                const eventsToDispatch = ['input', 'change', 'blur']; // Add others if needed
                eventsToDispatch.forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true, cancelable: true });
                    inputElement.dispatchEvent(event);
                });
            }
        } else if (originalName && formData.hasOwnProperty(originalName)) {
             // Fallback/Alternative: Handle fields based on original name (for radio/checkbox groups stored by group name)
             const value = formData[originalName];

             if (inputType === 'checkbox') {
                 // Assumes formData[originalName] is an array of checked values for the group
                 if (Array.isArray(value)) {
                     inputElement.checked = value.includes(inputElement.value || 'on');
                 } else {
                     // Handle case where single checkbox group was saved as boolean? (Less common)
                     inputElement.checked = !!value && inputElement.value === (inputElement.value || 'on'); // Check if the value matches this specific checkbox
                 }
             } else if (inputType === 'radio') {
                 // Assumes formData[originalName] is the single value for the selected radio in the group
                 inputElement.checked = (inputElement.value === value);
             }
             // Potentially trigger events here too if needed for fallback cases
            // Consider dispatching change/input events here as well if this fallback is used
         }
     });

    // Visual feedback for the user
    highlightFilledFields(containerElement); // Pass the container
 }
// Visually highlights filled fields within a container element.
function highlightFilledFields(containerElement) {
    if (!containerElement) return;
    const inputs = containerElement.querySelectorAll('input, select, textarea');
    const highlightColor = '#e6ffe6'; // Light green
    const highlightDuration = 1500; // ms
    const transitionTime = '1s';

    inputs.forEach(inputElement => {
        if (isIgnoredInput(inputElement)) {
            return; // Skip ignored inputs
        }

        // Add a subtle animation to show the field was filled
        const originalBackground = inputElement.style.backgroundColor || ''; // Store original or empty
        inputElement.style.transition = 'background-color 0.5s ease-in-out'; // Smoother transition
        inputElement.style.backgroundColor = highlightColor; // Light green

        // Reset background after a delay
        setTimeout(() => {
            inputElement.style.backgroundColor = originalBackground; // Restore original
            // Remove transition after animation to prevent interference
            setTimeout(() => { inputElement.style.transition = ''; }, 500);
        }, 1000); // Shorter duration
    });
}


// --- UI Button Creation ---

// Creates and adds the 'Extract & Save' button to the page.
function addExtractButton(targetSelector = '#ng-formulario') {
    const buttonStyles = {
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: '9999',
        padding: '10px',
        backgroundColor: '#4CAF50', // Green
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    };
    const saveButton = createStyledButton('Extract & Save Form Data', buttonStyles, 'form-transfer-save-button');
    button.id = 'form-transfer-save-button'; // Add an ID for easier selection/checking
    
    button.onclick = () => {
        // Find the target container using the provided selector
        const targetContainer = document.querySelector(targetSelector);
        if (!targetContainer) {
            console.error(`Container "${targetSelector}" not found for data extraction!`);
            return;
        }
        const data = extractFormData(targetContainer); // Pass the container element
        if (data && Object.keys(data).length > 0) { // Check if data is not null and not empty
            // Generate a filename based on form/page context if possible
            const filename = `form_data_${targetContainer.id || 'page'}_${new Date().toISOString().split('T')[0]}.json`;
            saveAsJson(data, filename);
        } else if (data) { // Data is not null but empty
             console.warn("No data extracted from the form container.");
        } else { // Data is null (extraction failed)
             console.error("Form data extraction failed.");
        }
    };
    
    document.body.appendChild(saveButton);
    return saveButton;
}

// Creates and adds the 'Load & Fill' button to the page.
function addLoadButton(targetSelector = '#ng-formulario') {
    const buttonStyles = {
        position: 'fixed',
        top: '60px', // Position below the save button
        right: '10px',
        zIndex: '9999',
        padding: '10px',
        backgroundColor: '#2196F3', // Blue
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    };
    const loadButton = createStyledButton('Load & Fill Form', buttonStyles, 'form-transfer-load-button');
    
    button.onclick = async () => {
        try {
            const data = await loadJsonFile(); // loadJsonFile gets the data
            if (data) {
                 // Find the target container using the provided selector
                 const targetContainer = document.querySelector(targetSelector);
                 if (!targetContainer) {
                     console.error(`Container "${targetSelector}" not found for filling!`);
                     return;
                 }
                 fillFormWithJson(targetContainer, data); // Pass the container and data
                 console.log("Form filled successfully!");
            }
        } catch (error) {
             // Log errors unless it's a user cancellation
             if (typeof error !== 'string' || !error.includes("cancelled by user")) {
                  console.error("Failed to load or fill the form:", error);
             } else {
                  console.log("Load/fill operation cancelled by user.");
             }
        }
    };
    
    document.body.appendChild(loadButton);
    return loadButton;
}

// --- Helper Functions ---

// Checks if an input element should be ignored during processing.
function isIgnoredInput(inputElement) {
    if (!inputElement) return true;
    // Ignore buttons
    if (['submit', 'button', 'reset'].includes(inputElement.type)) {
        return true;
    }
    // Ignore fields without name or id (cannot be reliably identified or used)
    if (!inputElement.name && !inputElement.id) {
        return true;
    }
    return false;
}

// Creates a button element with specified text, styles, and ID.
function createStyledButton(text, styles, id) {
    const button = document.createElement('button');
    button.textContent = text;
    if (id) {
        button.id = id;
    }
    // Apply styles
    for (const style in styles) {
        if (styles.hasOwnProperty(style)) {
            button.style[style] = styles[style];
        }
    }
    return button;
}


// --- Main Script Execution ---

// Initialize the form transfer buttons
// Initializes the form transfer functionality by adding buttons to the page.
function initializeFormTransfer(containerSelector = '#ng-formulario') {
    // Check if buttons already exist to prevent duplication if script runs multiple times.
    const saveButtonId = 'form-transfer-save-button';
    const loadButtonId = 'form-transfer-load-button';
    const saveButtonExists = document.getElementById(saveButtonId);
    const loadButtonExists = document.getElementById(loadButtonId);

    if (!saveButtonExists) {
        const saveButton = addExtractButton(containerSelector);
        // saveButton.id = saveButtonId; // ID is set inside addExtractButton now
    }
    if (!loadButtonExists) {
        const loadButton = addLoadButton(containerSelector);
        // loadButton.id = loadButtonId; // ID is set inside addLoadButton now
    }

    if (!saveButtonExists || !loadButtonExists) {
        console.log("Form Transfer buttons initialized!");
    } else {
        console.log("Form Transfer buttons already exist.");
    }
}

// Execute initialization when the DOM is fully loaded
(function() {
    // Encapsulate in an IIFE to avoid global scope pollution
    const runInit = () => initializeFormTransfer('#ng-formulario'); // Pass the specific selector

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInit);
    } else {
        // DOM is already loaded
        runInit();
    }
})();

// --- Bookmarklet Notes ---
// To use this script as a bookmarklet, the code needs to be bundled into a single
// expression, minified, URL-encoded, and prefixed with `javascript:`.
// The current multi-function structure isn't directly suitable without a build step.
/*
javascript:(function(){
    const script = document.createElement('script');
    script.src = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(`
        // Paste the entire script content here, ideally minified.
    `);
    document.body.appendChild(script);
})();
*/
// The script now initializes itself based on DOMContentLoaded or immediately if already loaded.
// The explicit init() call at the end is removed to avoid potential double initialization.