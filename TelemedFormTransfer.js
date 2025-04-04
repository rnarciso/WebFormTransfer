(function() {
    // =============== Funções Principais (Revisadas Novamente) ===============

    // --- extractFormData (Mantida da versão anterior) ---
    function extractFormData(formId) {
        const form = document.getElementById(formId); if (!form) { console.error(`Formulário #${formId} não encontrado.`); alert(`Erro: Formulário #${formId} não encontrado.`); return null; }
        console.log(`Extraindo dados: #${formId}`); const formData = {};
        const elements = form.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="reset"]), select, textarea');
        elements.forEach(element => {
            const name = element.name; if (!name || element.disabled || (element.closest('[style*="display: none"]') && element.closest('[id*="template"]'))) return;
            let value; const type = element.type ? element.type.toLowerCase() : element.tagName.toLowerCase();
            switch (type) {
                case 'checkbox': if (name.endsWith('[]')) { const b = name.slice(0, -2); if (!formData[b]) formData[b] = []; if (element.checked) formData[b].push(element.value); } else { formData[name] = element.checked; } break;
                case 'radio': if (element.checked) formData[name] = element.value; else if (!(name in formData)) formData[name] = null; break;
                case 'select-multiple': formData[name] = []; for (const o of element.options) { if (o.selected) formData[name].push(o.value); } break;
                case 'select': case 'textarea': case 'text': case 'hidden': case 'password': case 'email': case 'number': case 'date': case 'time': case 'tel': case 'url': case 'search': formData[name] = element.value; break;
                default: if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') && typeof element.value !== 'undefined') { formData[name] = element.value; } else { console.warn(`Tipo não tratado: ${name} (${type})`); } break;
            }
        });
        form.querySelectorAll('.selectMultText').forEach(comp => { const s = comp.querySelector('select'), t = comp.querySelector('input.multText'), b = comp.querySelector('[name$="[]"]'); if (s&&t&&b&&b.name){ const n=b.name.slice(0,-2); if(!formData[n]||!Array.isArray(formData[n])) formData[n]=[]; const sv=s.value, tv=t.value; if(sv||tv){formData[n].push([sv,tv]); if(s.name&&formData.hasOwnProperty(s.name)) delete formData[s.name]; if(t.name&&formData.hasOwnProperty(t.name)) delete formData[t.name];}}});
        form.querySelectorAll('.ng-matrix').forEach(matrix => { const inputs = matrix.querySelectorAll('input[name*="["][name*="]"]'); if(inputs.length===0) return; const matrixName = inputs[0].name.substring(0,inputs[0].name.indexOf('[')); let matrixData=[]; inputs.forEach(input => {const m=input.name.match(/\[(\d+)\]\[(\d+)\]/); if(m){const r=parseInt(m[1],10),c=parseInt(m[2],10); if(!matrixData[r]) matrixData[r]=[]; matrixData[r][c]=input.value;}}); matrixData=matrixData.filter(row=>row&&row.some(cell=>cell||cell===0||cell===false)); if(matrixData.length>0) formData[matrixName]=matrixData; else if(formData.hasOwnProperty(matrixName)) delete formData[matrixName];});
        for(const key in formData){if(formData.hasOwnProperty(key)){const v=formData[key]; if(v===null||v===undefined||v===""||(Array.isArray(v)&&v.length===0)||(Array.isArray(v)&&v.every(i=>i===null||i===undefined||i===""))){console.log(`Limpando: ${key}`); delete formData[key];}}}
        console.log("Extração finalizada.", formData); return formData;
    }

    // --- downloadJson (Mantida da versão anterior) ---
    function downloadJson(data, filename = 'formData.json') {
        if (!data || Object.keys(data).length === 0) { console.error("Nada para baixar."); alert("Nada extraído."); return; }
        try { const s = JSON.stringify(data, null, 2); const b = new Blob([s], {type:'application/json'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); console.log(`Exportado: ${filename}`); }
        catch (e) { console.error("Erro download:", e); alert("Erro download."); }
    }

    // --- populateForm (Revisada para Rádios) ---
    function populateForm(formId, formDataToRestore) {
        const form = document.getElementById(formId);
        if (!form) { console.error(`Formulário #${formId} não encontrado.`); alert(`Erro: Formulário #${formId} não encontrado.`); return; }
        if (!formDataToRestore || Object.keys(formDataToRestore).length === 0) { console.error("Nada para restaurar."); alert("Dados inválidos."); return; }
        console.log(`Populando formulário #${formId}...`);

        // Limpeza prévia (mantida)
        form.querySelectorAll('.selectMultText').forEach(comp => {const rows=comp.querySelectorAll(':scope > div'); for(let i=rows.length-1;i>0;i--){const btn=rows[i].querySelector('button.btn-danger'); if(btn) btn.click(); else rows[i].remove();} if(rows[0]){const s=rows[0].querySelector('select'), t=rows[0].querySelector('input.multText'); if(s)s.value=''; if(t)t.value='';}});
        form.querySelectorAll('.ng-matrix').forEach(matrix => {const rows = matrix.querySelectorAll('tbody > tr'); for(let i=rows.length-1;i>0;i--){const btn=rows[i].querySelector('button.btn-danger'); if(btn) btn.click(); else rows[i].remove();} if(rows[0]){rows[0].querySelectorAll('input').forEach(inp=>inp.value='');}});

        for (const name in formDataToRestore) {
            if (formDataToRestore.hasOwnProperty(name)) {
                const value = formDataToRestore[name];
                const elements = form.querySelectorAll(`[name="${name}"], [name="${name}[]"]`);
                if (elements.length === 0) { console.warn(`Elemento não encontrado: [name="${name}"]`); continue; }

                console.log(`Processando [name="${name}"] com valor JSON:`, value);

                 // Tratamento Componentes Complexos (mantido, timeout aumentado)
                if (name === 'for_ClassificaoRecomendacoes' && Array.isArray(value) && value.length > 0) {
                     console.log(`Populando selectMultipleText: ${name}`); const container = form.querySelector(`#default_${name}, [id*="${name}"]`);
                     if (container) { const addButton = container.querySelector('button.btn-success[onclick*="clonarCampo"]'); let currentRows = container.querySelectorAll(':scope > div.input-group, :scope > .selectMultText'); console.log(` - Linhas: ${currentRows.length} existentes, ${value.length} necessárias.`);
                         if (addButton) { for (let i = currentRows.length; i < value.length; i++) { console.log(` - Add linha ${i+1}`); try { addButton.click(); } catch (e) { console.error("Erro add", e); } } } else if (currentRows.length < value.length) { console.warn(` - Botão add ${name} não encontrado.`); }
                         setTimeout(() => {
                             console.log(` - Populando ${value.length} linha(s) para ${name}...`); currentRows = container.querySelectorAll(':scope > div.input-group, :scope > .selectMultText'); // Reconsulta
                             value.forEach((pair, index) => {
                                 if (currentRows[index]) {
                                     const select = currentRows[index].querySelector('select'); const textInput = currentRows[index].querySelector('input.multText');
                                     const selectValue = pair[0] ?? ''; const textValue = pair[1] ?? '';
                                     console.log(`   - Linha ${index + 1}: Select='${selectValue}', Text='${textValue}'`);
                                     if (select) { select.value = selectValue; select.dispatchEvent(new Event('input',{bubbles:true})); select.dispatchEvent(new Event('change',{bubbles:true})); if (typeof $ !== 'undefined' && $(select).data('chosen')) { console.log(`   - Update Chosen L${index+1}`); $(select).trigger('chosen:updated'); } } else console.warn(`   - Select L${index+1} não achado`);
                                     if (textInput) { textInput.value = textValue; textInput.dispatchEvent(new Event('input',{bubbles:true})); textInput.dispatchEvent(new Event('change',{bubbles:true})); } else console.warn(`   - Text L${index+1} não achado`);
                                 } else { console.warn(` - Linha ${index + 1} ${name} não encontrada no DOM.`); } });
                             console.log(` - Populamento ${name} concluído.`);
                         }, 500); // Timeout mantido
                     } else { console.warn(`Container ${name} não encontrado.`); } continue;
                 }
                 if (Array.isArray(value) && value.every(Array.isArray) && elements.length > 0 && elements[0].closest('.ng-matrix')) { // textMatrix
                    console.log(`Populando textMatrix: ${name}`); const matrixContainer = elements[0].closest('.ng-matrix').parentNode; const addButton = matrixContainer.querySelector('button.btn-success[onclick*="clonarCampo"]'); let currentInputs=matrixContainer.querySelectorAll(`input[name^="${name}["]`); let currentRowCount=0; currentInputs.forEach(inp=>{const m=inp.name.match(/\[(\d+)\]/);if(m)currentRowCount=Math.max(currentRowCount,parseInt(m[1],10)+1);}); console.log(` - Linhas: ${currentRowCount} existentes, ${value.length} necessárias.`); if(addButton){for(let i=currentRowCount;i<value.length;i++){console.log(` - Add linha ${i+1}`); try{addButton.click();}catch(e){console.error("Erro add linha matrix",e);}}}else if(currentRowCount<value.length){console.warn(` - Botão add matrix ${name} não encontrado.`);}
                     setTimeout(() => { console.log(` - Populando ${value.length} linha(s) matrix ${name}...`); value.forEach((rowData, rowIndex) => { rowData.forEach((cellData, colIndex) => { const sel=`input[name="${name}[${rowIndex}][${colIndex}]"]`; const inp=matrixContainer.querySelector(sel); if(inp){inp.value=cellData??'';inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true}));}});}); }, 500); continue;
                }

                // --- Processamento Padrão (com ajuste para Rádios) ---
                elements.forEach(element => {
                    const type = element.type ? element.type.toLowerCase() : element.tagName.toLowerCase();
                    let processed = false;
                    try {
                        switch (type) {
                            case 'checkbox':
                                if (element.name === name + '[]' && Array.isArray(value)) { element.checked = value.map(v => String(v).trim()).includes(String(element.value).trim()); processed = true; } // Compara com trim
                                else if (element.name === name) { element.checked = !!value; processed = true; }
                                break;
                            case 'radio':
                                // *** AJUSTE: Comparação com trim() ***
                                const radioValueTrimmed = String(element.value).trim();
                                const targetValueTrimmed = String(value).trim(); // Valor do JSON como string trimada
                                const shouldBeChecked = (radioValueTrimmed === targetValueTrimmed);
                                console.log(`   - Radio [name="${name}", value="${element.value}" (Trimmed: "${radioValueTrimmed}")]: Comparando com "${targetValueTrimmed}". Deve marcar? ${shouldBeChecked}`);
                                if (element.name === name) { // Garante que é o grupo certo
                                    element.checked = shouldBeChecked;
                                    processed = true; // Marca como processado para disparar eventos
                                }
                                break;
                            case 'select-multiple':
                                if (Array.isArray(value)) { const stringValues = value.map(v => String(v).trim()); for (const option of element.options) { option.selected = stringValues.includes(String(option.value).trim()); } processed = true; } // Compara com trim
                                break;
                             case 'select': case 'textarea': case 'text': case 'hidden': case 'number': case 'date': case 'time': case 'password': case 'email': case 'tel': case 'url': case 'search':
                             default:
                                 if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') && typeof element.value !== 'undefined') { element.value = value ?? ''; processed = true; }
                         }
                        if (processed) { // Dispara eventos se o elemento foi modificado
                            element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true }));
                            if (type === 'select' && typeof $ !== 'undefined' && $(element).data('chosen')) { $(element).trigger('chosen:updated'); }
                        }
                    } catch (error) { console.error(`Erro [name="${name}"] (Tipo: ${type}): `, error); }
                }); // Fim elements.forEach
            } // Fim hasOwnProperty
        } // Fim for...in

        console.log("Populamento inicial concluído. Aguardando lógica dinâmica final...");
         setTimeout(() => { // Timeout final (mantido)
             console.log("Tentando atualizar lógica dinâmica da página (final)...");
             if(typeof calculoDinamico === 'function'){try{console.log("Re-disparando 'change'..."); document.querySelectorAll('[data-dinamico]').forEach(el => el.dispatchEvent(new Event('change', { bubbles: true })));}catch(e){console.error("Erro 'change':", e);}}
             if(typeof hideShowCampo === 'function'){try{console.log("Executando hideShowCampo()..."); document.querySelectorAll('*[data-condicao]').forEach(el => hideShowCampo(el));}catch(e){console.error("Erro hideShow:", e);}}
             if(typeof $ !== 'undefined' && $.fn.chosen){try{console.log("Atualizando Chosen (final)..."); $('select.chosen-select, select[class*="chosen"]').trigger('chosen:updated');}catch(e){console.error("Erro Chosen:", e);}}
             console.log("Atualização dinâmica finalizada.");
         }, 1000); // Timeout final aumentado para 1s

    }

    // =============== Criação da UI (sem alterações) ===============
    function createFormToolsUI(targetFormId = 'formPreencher') {
        const containerId = 'form-tools-container-unique'; if (document.getElementById(containerId)) document.getElementById(containerId).remove();
        const container = document.createElement('div'); container.id = containerId;
        container.style.cssText = `position:fixed;top:10px;right:10px;z-index:10001;background:#f0f0f0;border:1px solid #ccc;border-radius:8px;padding:15px;box-shadow:0 4px 8px rgba(0,0,0,0.2);font-family:Arial,sans-serif;font-size:14px;max-width:250px;`;
        const title = document.createElement('h4'); title.textContent = 'Ferramentas Formulário'; title.style.cssText = 'margin-top:0;margin-bottom:10px;text-align:center;color:#333;';
        const exportBtn = document.createElement('button'); exportBtn.textContent = 'Exportar Dados (Baixar JSON)'; exportBtn.style.cssText = `display:block;width:100%;padding:8px 10px;margin-bottom:10px;cursor:pointer;background-color:#4CAF50;color:white;border:none;border-radius:4px;font-size:inherit;`;
        exportBtn.onclick = () => { const data = extractFormData(targetFormId); if (data) { const ts = new Date().toISOString().replace(/[:.]/g,'-'); downloadJson(data, `form_${targetFormId}_${ts}.json`); } };
        const importBtn = document.createElement('button'); importBtn.textContent = 'Importar Dados (Carregar JSON)'; importBtn.style.cssText = `display:block;width:100%;padding:8px 10px;margin-bottom:10px;cursor:pointer;background-color:#008CBA;color:white;border:none;border-radius:4px;font-size:inherit;`;
        const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = '.json,application/json'; fileInput.style.display = 'none';
        importBtn.onclick = () => fileInput.click();
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0]; if (!file) return; if (file.type && file.type !== 'application/json' && !file.name.endsWith('.json')) { alert('Selecione .json'); fileInput.value=''; return; }
            const reader = new FileReader();
            reader.onload = (e) => { try { const jsonData = JSON.parse(e.target.result); if(typeof jsonData !== 'object' || jsonData === null) throw new Error("Conteúdo inválido."); populateForm(targetFormId, jsonData); alert('Formulário populado!'); } catch (error) { console.error("Erro JSON:", error); alert(`Erro JSON:\n${error.message}`); } finally { fileInput.value = ''; }};
            reader.onerror = (e) => { console.error("Erro leitura:", e); alert("Erro leitura arquivo."); fileInput.value = ''; }; reader.readAsText(file);
        });
        const closeBtn = document.createElement('button'); closeBtn.textContent = 'Fechar Ferramentas'; closeBtn.style.cssText = `display:block;width:100%;padding:6px 8px;margin-top:10px;cursor:pointer;background-color:#f44336;color:white;border:none;border-radius:4px;font-size:inherit;`;
        closeBtn.onclick = () => container.remove();
        container.appendChild(title); container.appendChild(exportBtn); container.appendChild(importBtn); container.appendChild(fileInput); container.appendChild(closeBtn);
        document.body.appendChild(container); console.log("Interface Ferramentas adicionada.");
    }

    // --- Inicializa a UI ---
    createFormToolsUI('formPreencher');

})();