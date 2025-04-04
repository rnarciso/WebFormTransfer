(function() {
    // =============== Seu Prompt Detalhado (Cole Aqui) ===============

    // =============== Funções Principais (Mantidas e Novas) ===============

    // --- extractFormData (Mantida) ---
    function extractFormData(formId) { /* ... seu código extractFormData completo aqui ... */
        const form = document.getElementById(formId); if (!form) { console.error(`Formulário #${formId} não encontrado.`); alert(`Erro: Formulário #${formId} não encontrado.`); return null; }
        console.log(`Extraindo dados: #${formId}`); const formData = {};
        const elements = form.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="reset"]), select, textarea');
        elements.forEach(element => {
            const name = element.name; if (!name || element.disabled || (element.closest('[style*="display: none"]') && !element.closest('[id*="template"]'))) return; // Corrigido para não extrair de templates
            let value; const type = element.type ? element.type.toLowerCase() : element.tagName.toLowerCase();
            switch (type) {
                case 'checkbox': if (name.endsWith('[]')) { const b = name.slice(0, -2); if (!formData[b]) formData[b] = []; if (element.checked) formData[b].push(element.value); } else { formData[name] = element.checked; } break;
                case 'radio': if (element.checked) formData[name] = element.value; else if (!(name in formData)) formData[name] = null; break; // Mantém null se nenhum radio for marcado
                case 'select-multiple': formData[name] = []; for (const o of element.options) { if (o.selected) formData[name].push(o.value); } break;
                case 'select': case 'select-one': case 'textarea': case 'text': case 'hidden': case 'password': case 'email': case 'number': case 'date': case 'time': case 'tel': case 'url': case 'search': formData[name] = element.value; break;
                default: if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') && typeof element.value !== 'undefined') { formData[name] = element.value; } else { console.warn(`Tipo não tratado durante extração: ${name} (${type})`); } break;
            }
        });
       form.querySelectorAll('.selectMultText').forEach(comp => { const s = comp.querySelector('select'), t = comp.querySelector('input.multText'), b = comp.querySelector('[name$="[]"]'); if (s&&t&&b&&b.name){ const n=b.name.slice(0,-2); if(!formData[n]||!Array.isArray(formData[n])) formData[n]=[]; const sv=s.value, tv=t.value; if(sv||tv){formData[n].push([sv,tv]); if(s.name&&formData.hasOwnProperty(s.name)) delete formData[s.name]; if(t.name&&formData.hasOwnProperty(t.name)) delete formData[t.name];}}});
       form.querySelectorAll('.ng-matrix').forEach(matrix => { const inputs = matrix.querySelectorAll('input[name*="["][name*="]"]'); if(inputs.length===0) return; const matrixName = inputs[0].name.substring(0,inputs[0].name.indexOf('[')); let matrixData=[]; inputs.forEach(input => {const m=input.name.match(/\[(\d+)\]\[(\d+)\]/); if(m){const r=parseInt(m[1],10),c=parseInt(m[2],10); if(!matrixData[r]) matrixData[r]=[]; matrixData[r][c]=input.value;}}); matrixData=matrixData.filter(row=>row&&row.some(cell=>cell||cell===0||cell===false)); if(matrixData.length>0) formData[matrixName]=matrixData; else if(formData.hasOwnProperty(matrixName)) delete formData[matrixName];});
        for(const key in formData){if(formData.hasOwnProperty(key)){const v=formData[key]; if(v===null||v===undefined||v===""||(Array.isArray(v)&&v.length===0)||(Array.isArray(v)&&v.every(i=>i===null||i===undefined||i===""))){console.log(`Limpando chave vazia/nula: ${key}`); delete formData[key];}}} // Limpeza final
        console.log("Extração finalizada.", formData); return formData;
    }

    // --- downloadJson (Mantida) ---
    function downloadJson(data, filename = 'formData.json') { /* ... seu código downloadJson completo aqui ... */
        if (!data || Object.keys(data).length === 0) { console.error("Nada para baixar."); alert("Nada extraído."); return; } try { const s = JSON.stringify(data, null, 2); const b = new Blob([s], {type:'application/json'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); console.log(`Exportado: ${filename}`); } catch (e) { console.error("Erro download:", e); alert("Erro download."); }
    }

// =============== Helper Functions for populateForm ===============

/**
 * Triggers standard input and change events, and updates Chosen if applicable.
 * @param {HTMLElement} element The form element.
 */
function triggerEvents(element) {
    if (!element) return;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    // Update Chosen if it's a select and Chosen is present and initialized
    const type = element.type ? element.type.toLowerCase() : element.tagName.toLowerCase();
    if ((type === 'select' || type === 'select-one' || type === 'select-multiple') && typeof $ !== 'undefined' && $(element).data('chosen')) {
        // console.log(`   - Triggering chosen:updated for [name="${element.name}"]`);
        $(element).trigger('chosen:updated');
    }
}

/**
 * Populates standard input types (text, textarea, select-one, hidden, etc.).
 * @param {HTMLElement} element The form element.
 * @param {string|number|null} value The value to set.
 */
function populateStandard(element, value) {
    element.value = value ?? ''; // Use empty string for null/undefined
    triggerEvents(element);
    // console.log(`   - Standard Populated [name="${element.name}"] with value: "${element.value}"`);
}

/**
 * Populates a single checkbox.
 * @param {HTMLInputElement} element The checkbox element.
 * @param {boolean|any} value The value to determine checked state.
 */
function populateSingleCheckbox(element, value) {
    element.checked = !!value; // Convert value to boolean
    triggerEvents(element);
    // console.log(`   - Single Checkbox Populated [name="${element.name}"] checked: ${element.checked}`);
}

/**
 * Populates a group of checkboxes (sharing the same name ending with []).
 * @param {NodeListOf<HTMLInputElement>} elements List of checkbox elements in the group.
 * @param {Array<string|number>} value Array of values that should be checked.
 */
function populateCheckboxGroup(elements, value) {
    if (!Array.isArray(value)) {
        console.warn(`   - Checkbox group [name="${elements[0]?.name}"] expected an array value, got:`, value);
        value = []; // Treat as empty if not an array
    }
    const checkedValuesTrimmed = value.map(v => String(v).trim());
    elements.forEach(element => {
        element.checked = checkedValuesTrimmed.includes(String(element.value).trim());
        // Only trigger event on the last one? Or each one? Triggering on each is safer.
        triggerEvents(element);
    });
    // console.log(`   - Checkbox Group Populated [name="${elements[0]?.name}"] with values:`, checkedValuesTrimmed);
}

/**
 * Populates a group of radio buttons.
 * @param {NodeListOf<HTMLInputElement>} elements List of radio elements in the group.
 * @param {string|number|null} value The value of the radio button to select.
 */
function populateRadioGroup(elements, value) {
    const targetValTrimmed = value !== null && value !== undefined ? String(value).trim() : null;
    let oneSelected = false;
    elements.forEach(element => {
        const radioValTrimmed = String(element.value).trim();
        element.checked = (targetValTrimmed !== null && radioValTrimmed === targetValTrimmed);
        if (element.checked) oneSelected = true;
        // Trigger events on the one that gets checked, or maybe just once at the end?
        // Triggering on the selected one seems most correct.
        if(element.checked) triggerEvents(element);
    });
     // If no radio button value matched, ensure events are triggered on the first radio
     // to potentially reset dependent fields based on the group's state.
    if (!oneSelected && elements.length > 0) {
        triggerEvents(elements[0]);
    }
    // console.log(`   - Radio Group Populated [name="${elements[0]?.name}"] selecting value: "${targetValTrimmed}". Selected? ${oneSelected}`);
}

/**
 * Populates a multi-select dropdown.
 * @param {HTMLSelectElement} element The select element.
 * @param {Array<string|number>} value Array of values to select.
 */
function populateSelectMultiple(element, value) {
    if (!Array.isArray(value)) {
        console.warn(`   - Select Multiple [name="${element.name}"] expected an array value, got:`, value);
        value = []; // Treat as empty if not an array
    }
    const selectedValuesTrimmed = value.map(v => String(v).trim());
    for (const option of element.options) {
        option.selected = selectedValuesTrimmed.includes(String(option.value).trim());
    }
    triggerEvents(element);
    // console.log(`   - Select Multiple Populated [name="${element.name}"] with values:`, selectedValuesTrimmed);
}

/**
 * Populates a 'selectMultipleText' custom component (e.g., for_ClassificaoRecomendacoes).
 * Handles adding rows and setting select/text values.
 * @param {HTMLElement} container The container element holding the component rows and add button.
 * @param {string} name The base name of the field (e.g., "for_ClassificaoRecomendacoes").
 * @param {Array<Array<string>>} value Array of [selectValue, textValue] pairs.
 */
function populateSelectMultipleText(container, name, value) {
    console.log(`Populando selectMultipleText: ${name}`);
    if (!container) { console.warn(`Container para ${name} não encontrado.`); return; }
    if (!Array.isArray(value)) { console.warn(`Dados inválidos para ${name}, esperado array de pares.`); value = []; }

    const addButton = container.querySelector('button.btn-success[onclick*="clonarCampo"]');
    const rowSelector = ':scope > div.input-group, :scope > .selectMultText'; // Selector for rows within the container

    // 1. Clear existing dynamic rows (keep the template row)
    let currentRows = container.querySelectorAll(rowSelector);
    for (let i = currentRows.length - 1; i > 0; i--) { // Iterate backwards
        const removeButton = currentRows[i].querySelector('button.btn-danger');
        if (removeButton) {
            try { removeButton.click(); } catch (e) { console.error(`Error clicking remove button for ${name} row ${i}:`, e); currentRows[i].remove(); }
        } else {
            currentRows[i].remove(); // Fallback if no remove button
        }
    }
    // Clear the first/template row
    if (currentRows.length > 0) {
        const firstRow = currentRows[0];
        const firstSelect = firstRow.querySelector('select'); if (firstSelect) firstSelect.value = '';
        const firstText = firstRow.querySelector('input.multText'); if (firstText) firstText.value = '';
        triggerEvents(firstSelect); // Trigger events even when clearing
        triggerEvents(firstText);
    }

    // 2. Add necessary rows
    currentRows = container.querySelectorAll(rowSelector); // Re-query after clearing
    const rowsNeeded = value.length;
    const rowsToAdd = rowsNeeded - currentRows.length;

    console.log(` - Linhas ${name}: ${currentRows.length} existentes, ${rowsNeeded} necessárias. Adicionando ${rowsToAdd > 0 ? rowsToAdd : 0}.`);
    if (addButton && rowsToAdd > 0) {
        for (let i = 0; i < rowsToAdd; i++) {
            console.log(` - Add linha ${currentRows.length + i + 1} para ${name}`);
            try { addButton.click(); } catch (e) { console.error(`Erro ao adicionar linha ${i + 1} para ${name}:`, e); }
        }
    } else if (rowsToAdd > 0) {
        console.warn(` - Botão adicionar para ${name} não encontrado, não é possível adicionar ${rowsToAdd} linha(s).`);
    }

    // 3. Populate rows after a delay (DOM updates might be async)
    setTimeout(() => {
        console.log(` - Aguardou 150ms. Populando ${rowsNeeded} linha(s) para ${name}...`);
        const finalRows = container.querySelectorAll(rowSelector); // Re-query after potential additions

        value.forEach((pair, index) => {
            if (finalRows[index]) {
                const row = finalRows[index];
                const select = row.querySelector('select');
                const textInput = row.querySelector('input.multText');
                const selectValue = pair?.[0] ?? '';
                const textValue = pair?.[1] ?? '';
                console.log(`   - Linha ${index + 1}: Tentando Select='${selectValue}', Text='${textValue}'`);

                if (select) {
                    const optionExists = Array.from(select.options).some(opt => opt.value === selectValue);
                    if (optionExists) {
                        select.value = selectValue;
                        console.log(`     - Select L${index + 1} populado com '${select.value}'.`);
                    } else {
                        console.warn(`     - AVISO: Opção '${selectValue}' não encontrada no select L${index + 1}. Deixando vazio.`);
                        select.value = ""; // Clear if invalid option
                    }
                    triggerEvents(select);
                } else { console.warn(`   - Select L${index + 1} não achado`); }

                if (textInput) {
                    textInput.value = textValue;
                    console.log(`     - Text L${index + 1} populado.`);
                    triggerEvents(textInput);
                } else { console.warn(`   - Text L${index + 1} não achado`); }
            } else {
                console.warn(` - Linha ${index + 1} para ${name} não encontrada no DOM após timeout e adições.`);
            }
        });
        console.log(` - Populamento ${name} concluído.`);
    }, 150); // Slightly increased delay for DOM updates
}


/**
 * Populates a 'textMatrix' custom component.
 * Handles adding rows and setting input values within the matrix.
 * @param {HTMLElement} matrixContainer The container element holding the matrix table and add button.
 * @param {string} name The base name of the field (e.g., "for_ExemploMatrix").
 * @param {Array<Array<string|number>>} value A 2D array representing the matrix data.
 */
function populateTextMatrix(matrixContainer, name, value) {
    console.log(`Populando textMatrix: ${name}`);
    if (!matrixContainer) { console.warn(`Container matrix para ${name} não encontrado.`); return; }
    if (!Array.isArray(value) || !value.every(Array.isArray)) { console.warn(`Dados inválidos para matrix ${name}, esperado array 2D.`); value = []; }

    const addButton = matrixContainer.querySelector('button.btn-success[onclick*="clonarCampo"]');
    const tbody = matrixContainer.querySelector('tbody');
    if (!tbody) { console.warn(` - Tbody não encontrado para matrix ${name}.`); return; }

    // 1. Clear existing dynamic rows (keep the template row)
    let currentRows = tbody.querySelectorAll('tr');
    for (let i = currentRows.length - 1; i > 0; i--) {
        const removeButton = currentRows[i].querySelector('button.btn-danger');
        if (removeButton) {
            try { removeButton.click(); } catch (e) { console.error(`Error clicking remove button for matrix ${name} row ${i}:`, e); currentRows[i].remove(); }
        } else {
            currentRows[i].remove(); // Fallback
        }
    }
    // Clear the first/template row inputs
    if (currentRows.length > 0) {
        currentRows[0].querySelectorAll('input').forEach(inp => {
            inp.value = '';
            triggerEvents(inp); // Trigger events on clear
        });
    }

    // 2. Add necessary rows
    currentRows = tbody.querySelectorAll('tr'); // Re-query
    const rowsNeeded = value.length;
    const rowsToAdd = rowsNeeded - currentRows.length;

    console.log(` - Linhas Matrix ${name}: ${currentRows.length} existentes, ${rowsNeeded} necessárias. Adicionando ${rowsToAdd > 0 ? rowsToAdd : 0}.`);
    if (addButton && rowsToAdd > 0) {
        for (let i = 0; i < rowsToAdd; i++) {
            console.log(` - Add linha matrix ${currentRows.length + i + 1} para ${name}`);
            try { addButton.click(); } catch (e) { console.error(`Erro ao adicionar linha matrix ${i + 1} para ${name}:`, e); }
        }
    } else if (rowsToAdd > 0) {
        console.warn(` - Botão adicionar matrix para ${name} não encontrado.`);
    }

    // 3. Populate rows after a delay
    setTimeout(() => {
        console.log(` - Aguardou 150ms. Populando ${rowsNeeded} linha(s) matrix ${name}...`);
        const finalRows = tbody.querySelectorAll('tr'); // Re-query

        value.forEach((rowData, rowIndex) => {
            if (finalRows[rowIndex]) {
                rowData.forEach((cellData, colIndex) => {
                    const inputSelector = `input[name="${name}[${rowIndex}][${colIndex}]"]`;
                    const inputElement = finalRows[rowIndex].querySelector(inputSelector);
                    if (inputElement) {
                        inputElement.value = cellData ?? '';
                        triggerEvents(inputElement);
                        // console.log(`   - Matrix[${rowIndex}][${colIndex}] populado com "${inputElement.value}".`);
                    } else {
                        console.warn(`   - Matrix Input ${inputSelector} não encontrado na linha ${rowIndex}.`);
                    }
                });
            } else {
                console.warn(` - Linha Matrix ${rowIndex} não encontrada no DOM para ${name} após timeout.`);
            }
        });
         console.log(` - Populamento matrix ${name} concluído.`);
    }, 150); // Slightly increased delay
}


// --- populateForm (Refatorada e com Retorno de Status/Feedback via Status Div) ---
function populateForm(formId, formDataToRestore) {
    const form = document.getElementById(formId);
    const statusDiv = document.getElementById('ai-status-message'); // Pega o status div

    // Função auxiliar para mostrar erro no statusDiv ou alert como fallback
    function reportError(message) {
        console.error(message);
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.color = 'red';
        } else {
            alert(message); // Fallback
        }
    }

    if (!form) { reportError(`Erro Crítico: Formulário #${formId} não encontrado.`); return false; } // Retorna false no erro
    if (!formDataToRestore || typeof formDataToRestore !== 'object') { reportError("Erro: Dados inválidos fornecidos para popular."); return false; } // Retorna false

    console.log(`Iniciando população do formulário #${formId}...`);
    console.log("Dados Recebidos:", JSON.parse(JSON.stringify(formDataToRestore)));

    // Limpeza e população... (lógica interna mantida como na refatoração anterior)
    for (const name in formDataToRestore) {
        if (formDataToRestore.hasOwnProperty(name)) {
            const value = formDataToRestore[name];
            // console.log(`Processando campo [name="${name}"] com valor JSON:`, value); // Log menos verboso

            let elements = form.querySelectorAll(`[name="${name}"], [name="${name}[]"]`);
            let element = elements.length > 0 ? elements[0] : null;

            if (!element) {
                const idElement = form.querySelector(`[id="default_${name}"]`);
                if (idElement && idElement.name) {
                     console.warn(`Elemento [name="${name}"] não encontrado, usando fallback [id="default_${name}"] que tem name="${idElement.name}"`);
                     elements = form.querySelectorAll(`[name="${idElement.name}"], [name="${idElement.name}[]"]`);
                     element = elements.length > 0 ? elements[0] : null;
                } else {
                     console.warn(`Elemento não encontrado para popular: [name="${name}"] (nem via ID fallback). Pulando.`);
                     continue;
                }
            }

            try {
                const multTextContainer = element?.closest('.selectMultText')?.parentNode ?? form.querySelector(`#default_${name}`);
                if (name === 'for_ClassificaoRecomendacoes' && multTextContainer) {
                     populateSelectMultipleText(multTextContainer, name, value);
                     continue;
                }

                const matrixContainer = element?.closest('.ng-matrix')?.parentNode;
                if (matrixContainer && Array.isArray(value) && value.every(Array.isArray)) {
                    const firstInputName = matrixContainer.querySelector('tbody input[name*="["][name*="]"]')?.name;
                    const matrixBaseName = firstInputName ? firstInputName.substring(0, firstInputName.indexOf('[')) : name;
                    populateTextMatrix(matrixContainer, matrixBaseName, value);
                    continue;
                }

                if (elements.length > 0) {
                    const firstElement = elements[0];
                    const type = firstElement.type ? firstElement.type.toLowerCase() : firstElement.tagName.toLowerCase();
                    switch (type) {
                        case 'checkbox':
                            if (firstElement.name.endsWith('[]')) { populateCheckboxGroup(elements, value); }
                            else { populateSingleCheckbox(firstElement, value); }
                            break;
                        case 'radio': populateRadioGroup(elements, value); break;
                        case 'select-multiple': populateSelectMultiple(firstElement, value); break;
                        case 'select': case 'select-one': case 'textarea': case 'text':
                        case 'hidden': case 'number': case 'date': case 'time': case 'password':
                        case 'email': case 'tel': case 'url': case 'search':
                            populateStandard(firstElement, value); break;
                        default:
                             if ((firstElement.tagName === 'INPUT' || firstElement.tagName === 'TEXTAREA' || firstElement.tagName === 'SELECT') && typeof firstElement.value !== 'undefined') {
                                 populateStandard(firstElement, value);
                             } else { console.warn(`Tipo de elemento não tratado: ${name} (Tipo: ${type}, Tag: ${firstElement.tagName})`); }
                    }
                } else { console.warn(`Elemento [name="${name}"] desapareceu.`); }
            } catch (error) { console.error(`Erro ao processar campo [name="${name}"]: `, error); /* Não para a execução */ }
        }
    }

    console.log("População inicial dos campos concluída.");

    // Dispara eventos para lógica dinâmica final (sem alert)
    setTimeout(() => {
        console.log("Iniciando atualização final da lógica dinâmica da página...");
        try {
            if (typeof calculoDinamico === 'function') {
                console.log(" - Disparando 'change' em [data-dinamico]...");
                document.querySelectorAll('[data-dinamico]').forEach(el => el.dispatchEvent(new Event('change', { bubbles: true })));
            }
            if (typeof hideShowCampo === 'function') {
                console.log(" - Executando hideShowCampo() em [data-condicao]...");
                document.querySelectorAll('*[data-condicao]').forEach(el => hideShowCampo(el));
            }
            if (typeof $ !== 'undefined' && $.fn.chosen) {
                console.log(" - Atualizando selects Chosen (final)...");
                $('select.chosen-select, select[class*="chosen"]').trigger('chosen:updated');
            }
        } catch(e) {
            console.error("Erro durante atualização dinâmica final:", e);
            // Reportar erro na UI pode ser útil aqui também
            reportError("Erro ao atualizar UI dinâmica após população.");
            // Mesmo com erro aqui, a população principal pode ter funcionado, então ainda retornamos true?
            // Ou consideramos isso uma falha? Vamos considerar falha se a UI dinâmica quebrar.
            // return false; // Descomentar se um erro aqui deve invalidar o sucesso geral
        }
        console.log("Atualização dinâmica finalizada.");
        // REMOVIDO: alert('Formulário populado com os dados fornecidos!');
    }, 500);

    return true; // Retorna true indicando sucesso na execução principal
}


   // --- Função para chamar a API Google AI (REMOVIDA) ---
   // A lógica foi movida para um backend seguro.

   // --- Função Handler para o Botão da IA (Modificada para usar Backend e Melhor UX) ---
   async function processHistoryWithAI(targetFormId) {
       console.log("Botão IA clicado.");
       const aiBtn = document.getElementById('ai-process-button');
       const historyTextArea = document.getElementById('ai-clinical-history-input'); // ID da nova textarea
       const statusDiv = document.getElementById('ai-status-message'); // Div para status/feedback

       if (!historyTextArea || !aiBtn || !statusDiv) {
           console.error("Elementos da UI da IA não encontrados (botão, textarea ou status div).");
           // Tenta dar um alerta se o statusDiv falhou, como último recurso
           if (!statusDiv) alert("Erro crítico: Elementos da UI da IA não encontrados.");
           else statusDiv.textContent = "Erro: UI da IA não inicializada corretamente.";
           return;
       }

       // 1. Obter História Clínica da Textarea
       const clinicalHistory = historyTextArea.value.trim();
       if (!clinicalHistory) {
           console.log("História clínica não fornecida na textarea.");
           statusDiv.textContent = 'Erro: Cole a história clínica na área de texto.';
           statusDiv.style.color = 'red'; // Cor de erro
           historyTextArea.focus(); // Foca na textarea para facilitar
           // Limpa a mensagem de erro após alguns segundos
           setTimeout(() => { if (statusDiv.textContent === 'Erro: Cole a história clínica na área de texto.') statusDiv.textContent = ''; }, 3000);
           return;
       }

       // 2. Iniciar Processamento (UI Feedback)
       aiBtn.disabled = true;
       aiBtn.textContent = 'Processando...'; // Muda o texto do botão
       historyTextArea.disabled = true; // Desabilita textarea durante o processamento
       statusDiv.textContent = 'Processando com IA... Aguarde.';
       statusDiv.style.color = '#333'; // Cor padrão para processando
       console.log("Enviando história para o backend...");

       // 3. Chamar Backend
       try {
           const response = await fetch('/api/process-clinical-history', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ history: clinicalHistory }),
           });

           const result = await response.json();

           if (!response.ok) {
               const errorMsg = result.error || `Erro do servidor: ${response.status} ${response.statusText}`;
               throw new Error(errorMsg); // Joga para o catch
           }

           // 4. Validar e Usar Resposta
           const formDataFromAI = result.formData;
           if (!formDataFromAI || typeof formDataFromAI !== 'object') {
               throw new Error("Resposta da IA (via backend) inválida ou vazia.");
           }

           console.log("JSON recebido do backend:", formDataFromAI);

           // 5. Popular Formulário (populateForm agora retorna true/false e usa statusDiv)
           const success = populateForm(targetFormId, formDataFromAI);

           if (success) {
                console.log("Formulário populado com sucesso pela IA.");
                statusDiv.textContent = 'Sucesso! Formulário populado.';
                statusDiv.style.color = 'green';
                historyTextArea.value = ''; // Limpa a textarea após sucesso
           } else {
               // Se populateForm retornar false, significa que houve um erro interno (ex: form não encontrado)
               // A própria populateForm já terá logado e setado a mensagem no statusDiv.
               console.error("Falha ao popular o formulário (ver logs anteriores).");
               // statusDiv já deve ter a mensagem de erro de populateForm
               if (statusDiv) statusDiv.style.color = 'red'; // Garante cor vermelha
           }

       } catch (error) {
           // 6. Tratar Erros (API ou Validação)
           console.error("Erro durante o processamento com IA via backend:", error);
           if (statusDiv) {
                statusDiv.textContent = `Erro: ${error.message}`;
                statusDiv.style.color = 'red';
           } else {
               alert(`Erro: ${error.message}`); // Fallback
           }
       } finally {
           // 7. Finalizar Processamento (UI Feedback)
           aiBtn.disabled = false;
           aiBtn.textContent = 'Processar História (AI)'; // Restaura texto do botão
           historyTextArea.disabled = false; // Reabilita textarea
           console.log("Processamento via backend finalizado (com sucesso ou erro).");
           // Limpa a mensagem de status após alguns segundos (apenas em caso de sucesso)
           if (statusDiv && statusDiv.style.color === 'green') {
                setTimeout(() => { if (statusDiv.textContent === 'Sucesso! Formulário populado.') statusDiv.textContent = ''; }, 5000);
           }
       }
   }

    // =============== Criação da UI (Modificada para Melhor UX da IA) ===============
    function createFormToolsUI(targetFormId = 'formPreencher') {
        const containerId = 'form-tools-container-unique';
        if (document.getElementById(containerId)) document.getElementById(containerId).remove();
        const container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = `position:fixed;top:10px;right:10px;z-index:10001;background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:15px;box-shadow:0 4px 8px rgba(0,0,0,0.1);font-family:Arial,sans-serif;font-size:14px;max-width:300px; display: flex; flex-direction: column; gap: 10px;`; // Aumentado max-width e adicionado gap

        const title = document.createElement('h4');
        title.textContent = 'Ferramentas Formulário';
        title.style.cssText = 'margin-top:0;margin-bottom:5px;text-align:center;color:#343a40;';

        // --- Botões Export/Import ---
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Exportar Dados (JSON)';
        exportBtn.style.cssText = `padding:8px 12px;cursor:pointer;background-color:#28a745;color:white;border:none;border-radius:4px;font-size:inherit; transition: background-color 0.2s;`;
        exportBtn.onmouseover = () => exportBtn.style.backgroundColor = '#218838';
        exportBtn.onmouseout = () => exportBtn.style.backgroundColor = '#28a745';
        exportBtn.onclick = () => {
            const data = extractFormData(targetFormId);
            if (data) { const ts = new Date().toISOString().replace(/[:.]/g, '-'); downloadJson(data, `form_${targetFormId}_${ts}.json`); }
        };

        const importBtn = document.createElement('button');
        importBtn.textContent = 'Importar Dados (JSON)';
        importBtn.style.cssText = `padding:8px 12px;cursor:pointer;background-color:#007bff;color:white;border:none;border-radius:4px;font-size:inherit; transition: background-color 0.2s;`;
        importBtn.onmouseover = () => importBtn.style.backgroundColor = '#0056b3';
        importBtn.onmouseout = () => importBtn.style.backgroundColor = '#007bff';
        const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = '.json,application/json'; fileInput.style.display = 'none';
        importBtn.onclick = () => fileInput.click();
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            const statusDiv = document.getElementById('ai-status-message'); // Usar o mesmo status div
            if (!file) return;
            if (file.type && file.type !== 'application/json' && !file.name.endsWith('.json')) {
                if(statusDiv) { statusDiv.textContent = 'Erro: Selecione um arquivo .json'; statusDiv.style.color = 'red'; }
                else { alert('Selecione um arquivo .json'); } // Fallback
                fileInput.value = ''; return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    if (typeof jsonData !== 'object' || jsonData === null) throw new Error("Conteúdo JSON inválido.");
                    const success = populateForm(targetFormId, jsonData); // populateForm retorna true/false
                    if (success && statusDiv) {
                        statusDiv.textContent = 'Sucesso! Formulário importado.'; statusDiv.style.color = 'green';
                        setTimeout(() => { if (statusDiv.textContent === 'Sucesso! Formulário importado.') statusDiv.textContent = ''; }, 5000);
                    } else if (!success && statusDiv) {
                         // populateForm já deve ter setado a mensagem de erro no statusDiv
                         statusDiv.style.color = 'red';
                    }
                } catch (error) {
                    console.error("Erro ao ler/parsear JSON:", error);
                    if(statusDiv) { statusDiv.textContent = `Erro importação: ${error.message}`; statusDiv.style.color = 'red'; }
                    else { alert(`Erro ao processar arquivo JSON:\n${error.message}`); } // Fallback
                } finally { fileInput.value = ''; }
            };
            reader.onerror = (e) => {
                console.error("Erro na leitura do arquivo:", e);
                 if(statusDiv) { statusDiv.textContent = 'Erro na leitura do arquivo.'; statusDiv.style.color = 'red'; }
                 else { alert("Erro na leitura do arquivo."); } // Fallback
                fileInput.value = '';
            };
            reader.readAsText(file);
        });

        // --- Seção da IA ---
        const aiSectionTitle = document.createElement('h5');
        aiSectionTitle.textContent = 'Assistente IA';
        aiSectionTitle.style.cssText = 'margin-top:10px; margin-bottom:5px; text-align:center; color:#6c757d; border-top: 1px solid #dee2e6; padding-top: 10px;';

        const aiInstructions = document.createElement('p');
        aiInstructions.textContent = 'Cole a história clínica abaixo:';
        aiInstructions.style.cssText = 'font-size: 13px; color: #6c757d; margin-bottom: 5px;';

        const historyTextArea = document.createElement('textarea');
        historyTextArea.id = 'ai-clinical-history-input'; // ID para referenciar
        historyTextArea.rows = 6; // Altura inicial
        historyTextArea.placeholder = 'Cole a história clínica completa aqui...';
        historyTextArea.style.cssText = `display:block;width:100%;padding:8px;margin-bottom:10px;border:1px solid #ced4da;border-radius:4px;font-size:13px;box-sizing:border-box; resize: vertical;`; // Permitir redimensionamento vertical

        const aiBtn = document.createElement('button');
        aiBtn.id = 'ai-process-button';
        aiBtn.textContent = 'Processar História (AI)';
        aiBtn.title = 'Usa a IA para analisar a história clínica e preencher o formulário.';
        aiBtn.style.cssText = `padding:8px 12px;cursor:pointer;background-color:#ffc107;color:#212529;border:none;border-radius:4px;font-size:inherit;font-weight:bold; transition: background-color 0.2s, color 0.2s;`;
        aiBtn.onmouseover = () => aiBtn.style.backgroundColor = '#e0a800';
        aiBtn.onmouseout = () => aiBtn.style.backgroundColor = '#ffc107';
        aiBtn.onclick = () => processHistoryWithAI(targetFormId);

        // --- Div de Status/Feedback ---
        const statusDiv = document.createElement('div');
        statusDiv.id = 'ai-status-message'; // ID para referenciar
        statusDiv.style.cssText = `margin-top:5px; padding: 8px; border-radius: 4px; font-size: 13px; text-align: center; min-height: 20px; transition: all 0.3s;`; // Estilo base para feedback

        // --- Botão Fechar ---
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Fechar Ferramentas';
        closeBtn.style.cssText = `padding:6px 10px;margin-top:10px;cursor:pointer;background-color:#dc3545;color:white;border:none;border-radius:4px;font-size:inherit; transition: background-color 0.2s;`;
        closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#c82333';
        closeBtn.onmouseout = () => closeBtn.style.backgroundColor = '#dc3545';
        closeBtn.onclick = () => container.remove();

        // --- Montagem da UI ---
        container.appendChild(title);
        container.appendChild(exportBtn);
        container.appendChild(importBtn);
        container.appendChild(fileInput); // Input escondido
        container.appendChild(aiSectionTitle);
        container.appendChild(aiInstructions);
        container.appendChild(historyTextArea); // Adiciona a textarea
        container.appendChild(aiBtn);
        container.appendChild(statusDiv); // Adiciona o div de status
        container.appendChild(closeBtn);
        document.body.appendChild(container);
        console.log("Interface Ferramentas (com UX melhorada para IA) adicionada.");
    }

    // =============== Inicialização ===============
    // Espera o DOM carregar completamente antes de adicionar a UI
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => createFormToolsUI('formPreencher'));
    } else {
        createFormToolsUI('formPreencher'); // DOM já carregado
    }
})();