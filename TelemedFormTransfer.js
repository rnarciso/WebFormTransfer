(function() {
    // =============== Funções Principais (Revisão Finalíssima) ===============

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

    // --- downloadJson (Mantida) ---
    function downloadJson(data, filename = 'formData.json') { /* ...código mantido... */
        if (!data || Object.keys(data).length === 0) { console.error("Nada para baixar."); alert("Nada extraído."); return; } try { const s = JSON.stringify(data, null, 2); const b = new Blob([s], {type:'application/json'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); console.log(`Exportado: ${filename}`); } catch (e) { console.error("Erro download:", e); alert("Erro download."); }
    }

    // --- populateForm (Revisada com Logs Detalhados para Recomendações) ---
    function populateForm(formId, formDataToRestore) {
        const form = document.getElementById(formId); if (!form) { console.error(`Form #${formId} ?`); alert(`Erro: Form #${formId} ?`); return; } if (!formDataToRestore || typeof formDataToRestore !== 'object') { console.error("Dados inválidos."); alert("Dados inválidos."); return; } console.log(`Populando #${formId}...`);
        const defaultValues = { "for_Admissa": "", "for_ProblemasAtivos": "", "for_SOFANeurologico": "10 a 12", "for_Sedacao": "Não", "for_PresencaDor": "Não", "for_DeliriumPresente": "Não há delirium", "for_UsoVasopressor": "Não", "for_UsoInotropicos": "Não", "for_Vasodilatador": "Não", "for_UsoAntiarritimicos": "Não", "for_SOFACardio": "Sem hipotensão", "for_SuporteVentilatorio": ["Ventilação mecânica invasiva"], "for_SOFARespiratorio": "200-299", "for_Nutrido": "Sim", "for_MetaAtingida": "Não", "for_MetaJustificativa": ["Em progressão"], "for_MetaJustificativaParenteral": ["Em progressão"], "for_Hipergl": "Não", "for_Hipogl": "Não", "for_SOFAHepatico": "< 1,2", "for_AlteracaoEletrolitica": "Não", "for_Dialise": "Não", "for_SOFARenal": "< 1,2", "for_OpInfeccao": "Não", "for_SOFAHemato": ">= 150", "for_DrogasAjustadas": "Não se aplica", "for_ReconciliacaoMedicamentosa": "Total", "for_SVD": "Sim", "for_CVC": "Sim", "for_CateterArterial": "Não", "for_Dreno": "Não", "for_PacienteMobilizado": "Não", "for_PeleIntegra": "Sim", "for_AltaPaciente": "Não", "for_ClassificaoRecomendacoes": [], "for_AtendimentoFarmacia": "Não", "for_PacienteWatcher": "Não" };
        console.log("Aplicando defaults..."); for (const fieldName in defaultValues) { if (!formDataToRestore.hasOwnProperty(fieldName)) { console.log(` - Default p/ "${fieldName}":`, defaultValues[fieldName]); formDataToRestore[fieldName] = defaultValues[fieldName]; } }
        console.log("Dados Finais:", formDataToRestore);
        // Limpeza prévia (mantida)
        form.querySelectorAll('.selectMultText').forEach(comp=>{const r=comp.querySelectorAll(':scope > div');for(let i=r.length-1;i>0;i--){const b=r[i].querySelector('button.btn-danger');if(b)b.click();else r[i].remove();}if(r[0]){const s=r[0].querySelector('select'),t=r[0].querySelector('input.multText');if(s)s.value='';if(t)t.value='';}});
        form.querySelectorAll('.ng-matrix').forEach(m=>{const r=m.querySelectorAll('tbody > tr');for(let i=r.length-1;i>0;i--){const b=r[i].querySelector('button.btn-danger');if(b)b.click();else r[i].remove();}if(r[0]){r[0].querySelectorAll('input').forEach(inp=>inp.value='');}});

        for (const name in formDataToRestore) {
            if (formDataToRestore.hasOwnProperty(name)) {
                const value = formDataToRestore[name]; const elements = form.querySelectorAll(`[name="${name}"], [name="${name}[]"]`);
                if (elements.length === 0) { console.warn(`Elemento não encontrado: [name="${name}"]`); continue; }
                console.log(`Processando [name="${name}"] com valor JSON:`, value);

                // Tratamento selectMultipleText (Com Logs Detalhados)
                if (name === 'for_ClassificaoRecomendacoes' && Array.isArray(value) && value.length > 0) {
                     console.log(`Populando selectMultipleText: ${name}`); const container = form.querySelector(`#default_${name}, [id*="${name}"]`);
                     if (container) { const addButton = container.querySelector('button.btn-success[onclick*="clonarCampo"]'); let currentRows = container.querySelectorAll(':scope > div.input-group, :scope > .selectMultText'); console.log(` - Linhas: ${currentRows.length} existentes, ${value.length} necessárias.`);
                         if (addButton) { for (let i = currentRows.length; i < value.length; i++) { console.log(` - Add linha ${i+1}`); try { addButton.click(); } catch (e) { console.error("Erro add", e); } } } else if (currentRows.length < value.length) { console.warn(` - Botão add ${name} não encontrado.`); }
                         setTimeout(() => { // Timeout mantido
                             console.log(` - Aguardou ${500}ms. Populando ${value.length} linha(s) para ${name}...`); currentRows = container.querySelectorAll(':scope > div.input-group, :scope > .selectMultText');
                             value.forEach((pair, index) => {
                                 if (currentRows[index]) {
                                     const select = currentRows[index].querySelector('select'); const textInput = currentRows[index].querySelector('input.multText');
                                     const selectValue = pair?.[0] ?? ''; const textValue = pair?.[1] ?? '';
                                     console.log(`   - Linha ${index + 1}: Tentando Select='${selectValue}', Text='${textValue}'`);
                                     if (select) {
                                         // *** LOG DETALHADO DO SELECT ***
                                         const availableOptions = Array.from(select.options).map(opt => opt.value);
                                         console.log(`     - Select L${index + 1} encontrado. Opções: [${availableOptions.join(', ')}]`);
                                         select.value = selectValue;
                                         console.log(`     - select.value DEPOIS de setar: '${select.value}'`); // Verifica se funcionou
                                         if (select.value !== selectValue && selectValue !== '') { console.warn(`     - AVISO: Falha ao setar valor '${selectValue}' no select L${index + 1}. Valor pode não existir ou conflito.`); }
                                         // *** FIM LOG DETALHADO ***
                                         select.dispatchEvent(new Event('input',{bubbles:true})); select.dispatchEvent(new Event('change',{bubbles:true}));
                                         if (typeof $ !== 'undefined' && $(select).data('chosen')) { console.log(`     - Update Chosen L${index + 1}`); $(select).trigger('chosen:updated'); }
                                     } else { console.warn(`   - Select L${index + 1} não achado`); }
                                     if (textInput) { textInput.value = textValue; textInput.dispatchEvent(new Event('input',{bubbles:true})); textInput.dispatchEvent(new Event('change',{bubbles:true})); } else { console.warn(`   - Text L${index + 1} não achado`); }
                                 } else { console.warn(` - Linha ${index + 1} ${name} não encontrada no DOM.`); } });
                             console.log(` - Populamento ${name} concluído.`);
                         }, 500); // Mantém 500ms
                     } else { console.warn(`Container ${name} ?`); } continue;
                 }
                 // Tratamento textMatrix (mantido)
                 if (Array.isArray(value) && value.every(Array.isArray) && elements.length > 0 && elements[0].closest('.ng-matrix')) { /* ... código textMatrix mantido ... */ console.log(`Populando textMatrix: ${name}`); const matrixContainer = elements[0].closest('.ng-matrix').parentNode; const addButton = matrixContainer.querySelector('button.btn-success[onclick*="clonarCampo"]'); let currentInputs=matrixContainer.querySelectorAll(`input[name^="${name}["]`); let currentRowCount=0; currentInputs.forEach(inp=>{const m=inp.name.match(/\[(\d+)\]/);if(m)currentRowCount=Math.max(currentRowCount,parseInt(m[1],10)+1);}); console.log(` - Linhas: ${currentRowCount} existentes, ${value.length} necessárias.`); if(addButton){for(let i=currentRowCount;i<value.length;i++){console.log(` - Add linha ${i+1}`); try{addButton.click();}catch(e){console.error("Erro add matrix",e);}}}else if(currentRowCount<value.length){console.warn(` - Botão add matrix ${name} ?`);} setTimeout(() => { console.log(` - Populando ${value.length} linha(s) matrix ${name}...`); value.forEach((rowData, rowIndex) => { rowData.forEach((cellData, colIndex) => { const sel=`input[name="${name}[${rowIndex}][${colIndex}]"]`; const inp=matrixContainer.querySelector(sel); if(inp){inp.value=cellData??'';inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true}));}});}); }, 500); continue; }

                // Processamento Padrão (mantido com log de rádio)
                elements.forEach(element => { const type = element.type ? element.type.toLowerCase() : element.tagName.toLowerCase(); let processed = false; try { switch (type) { case 'checkbox': if(element.name===name+'[]'&&Array.isArray(value)){element.checked=value.map(v=>String(v).trim()).includes(String(element.value).trim());processed=true;}else if(element.name===name){element.checked=!!value;processed=true;}break; case 'radio': const radioValT=String(element.value).trim(); const targetValT=String(value).trim(); const checkIt=(radioValT===targetValT); console.log(`   - Radio[n="${name}",v="${element.value}"(T:"${radioValT}")]: Comp c/"${targetValT}". Marcar? ${checkIt}`); if(element.name===name){element.checked=checkIt;processed=true;}break; case 'select-multiple': if(Array.isArray(value)){const sVals=value.map(v=>String(v).trim());for(const o of element.options){o.selected=sVals.includes(String(o.value).trim());}processed=true;}break; case'select':case'textarea':case'text':case'hidden':case'number':case'date':case'time':case'password':case'email':case'tel':case'url':case'search':default: if((element.tagName==='INPUT'||element.tagName==='TEXTAREA'||element.tagName==='SELECT')&&typeof element.value!=='undefined'){element.value=value??'';processed=true;} } if(processed){ element.dispatchEvent(new Event('input',{bubbles:true})); element.dispatchEvent(new Event('change',{bubbles:true})); if(type==='select'&&typeof $!=='undefined'&&$(element).data('chosen')){$(element).trigger('chosen:updated');}}} catch (error) { console.error(`Erro [n="${name}"] (${type}): `, error); } });
            }
        }

        console.log("Pop. inicial OK. Aguardando lógica dinâmica final...");
         setTimeout(() => { console.log("Atualizando lógica dinâmica (final)..."); if(typeof calculoDinamico==='function'){try{console.log("Trigger 'change'..."); document.querySelectorAll('[data-dinamico]').forEach(el=>el.dispatchEvent(new Event('change',{bubbles:true})));}catch(e){console.error("Erro trigger 'change':",e);}} if(typeof hideShowCampo==='function'){try{console.log("Exec hideShowCampo()..."); document.querySelectorAll('*[data-condicao]').forEach(el=>hideShowCampo(el));}catch(e){console.error("Erro hideShow:",e);}} if(typeof $!=='undefined'&&$.fn.chosen){try{console.log("Update Chosen(final)...");$('select.chosen-select,select[class*="chosen"]').trigger('chosen:updated');}catch(e){console.error("Erro Chosen:",e);}} console.log("Update dinâmico finalizado."); }, 1000);
    }

    // =============== Criação da UI (sem alterações) ===============
    function createFormToolsUI(targetFormId = 'formPreencher') { /* ...código mantido... */
        const containerId='form-tools-container-unique'; if(document.getElementById(containerId))document.getElementById(containerId).remove(); const container=document.createElement('div'); container.id=containerId; container.style.cssText=`position:fixed;top:10px;right:10px;z-index:10001;background:#f0f0f0;border:1px solid #ccc;border-radius:8px;padding:15px;box-shadow:0 4px 8px rgba(0,0,0,0.2);font-family:Arial,sans-serif;font-size:14px;max-width:250px;`; const title=document.createElement('h4'); title.textContent='Ferramentas Formulário'; title.style.cssText='margin-top:0;margin-bottom:10px;text-align:center;color:#333;'; const exportBtn=document.createElement('button'); exportBtn.textContent='Exportar Dados (Baixar JSON)'; exportBtn.style.cssText=`display:block;width:100%;padding:8px 10px;margin-bottom:10px;cursor:pointer;background-color:#4CAF50;color:white;border:none;border-radius:4px;font-size:inherit;`; exportBtn.onclick=()=>{const data=extractFormData(targetFormId);if(data){const ts=new Date().toISOString().replace(/[:.]/g,'-');downloadJson(data,`form_${targetFormId}_${ts}.json`);}}; const importBtn=document.createElement('button'); importBtn.textContent='Importar Dados (Carregar JSON)'; importBtn.style.cssText=`display:block;width:100%;padding:8px 10px;margin-bottom:10px;cursor:pointer;background-color:#008CBA;color:white;border:none;border-radius:4px;font-size:inherit;`; const fileInput=document.createElement('input'); fileInput.type='file'; fileInput.accept='.json,application/json'; fileInput.style.display='none'; importBtn.onclick=()=>fileInput.click(); fileInput.addEventListener('change',(event)=>{const file=event.target.files[0];if(!file)return;if(file.type&&file.type!=='application/json'&&!file.name.endsWith('.json')){alert('Selecione .json');fileInput.value='';return;}const reader=new FileReader();reader.onload=(e)=>{try{const jsonData=JSON.parse(e.target.result);if(typeof jsonData!=='object'||jsonData===null)throw new Error("Conteúdo inválido.");populateForm(targetFormId,jsonData);alert('Formulário populado!');}catch(error){console.error("Erro JSON:",error);alert(`Erro JSON:\n${error.message}`);}finally{fileInput.value='';}};reader.onerror=(e)=>{console.error("Erro leitura:",e);alert("Erro leitura arquivo.");fileInput.value='';};reader.readAsText(file);}); const closeBtn=document.createElement('button'); closeBtn.textContent='Fechar Ferramentas'; closeBtn.style.cssText=`display:block;width:100%;padding:6px 8px;margin-top:10px;cursor:pointer;background-color:#f44336;color:white;border:none;border-radius:4px;font-size:inherit;`; closeBtn.onclick=()=>container.remove(); container.appendChild(title);container.appendChild(exportBtn);container.appendChild(importBtn);container.appendChild(fileInput);container.appendChild(closeBtn); document.body.appendChild(container);console.log("Interface Ferramentas adicionada.");
    }

    // --- Inicializa a UI ---
    createFormToolsUI('formPreencher');

})();