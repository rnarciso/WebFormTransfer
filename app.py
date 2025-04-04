import os
import json
import requests
from flask import Flask, request, jsonify
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

app = Flask(__name__)

# =============== AI Prompt (Copied from TelemedWithAIForm.js) ===============
# It's generally better to manage large prompts externally, but for simplicity,
# it's included here. Ensure this matches the frontend expectations.
BASE_AI_PROMPT = """Você é um assistente de IA especializado em extrair informações clínicas estruturadas de texto não estruturado. Sua tarefa é analisar a história clínica do paciente que será fornecida no próximo prompt e gerar um objeto JSON que resuma os dados do paciente e as recomendações clínicas relevantes.

Instruções Detalhadas:

1.  Análise do Texto: Leia atentamente a história clínica completa do paciente fornecida. Extraia informações demográficas, detalhes da admissão, histórico médico, narrativa clínica, medicamentos, funcionalidade e outros dados pertinentes.
2.  Geração do JSON: Crie um objeto JSON usando os nomes de campo do formulário fornecidos abaixo (prefixados com `for_`).
3.  Formato Simplificado: Inclua SOMENTE os campos para os quais há informações relevantes na história clínica. NÃO inclua campos que seriam nulos, vazios ou "Não aplicável" com base no texto fornecido.
4.  Adesão aos Valores Permitidos: Para campos com opções predefinidas, você DEVE selecionar o valor mais apropriado clinicamente dentre as opções válidas listadas abaixo para esse campo específico. Se a informação exata não estiver presente, faça a melhor estimativa clínica com base no contexto (por exemplo, "responsiva" geralmente implica Glasgow 15) e, se apropriado, indique que é uma estimativa (ex: "(estimado)").
5.  Campos Condicionais: Preencha os campos condicionais apenas se a condição especificada for atendida pelo valor do campo pai. Por exemplo, `for_SAVAS` só deve ser incluído se `for_PresencaDor` for "Sim".
6.  Síntese e Resumo: Para campos como `for_Admissa`, `for_FatosRelevantes`, `for_ProblemasAtivos`, `for_ComentarioSA`, `for_MetaHemodinamica`, etc., sintetize as informações relevantes da história em um texto conciso e clinicamente apropriado.
7.  Recomendações Clínicas: Gere recomendações clínicas pertinentes com base na condição do paciente. Use o campo `for_ClassificaoRecomendacoes` para isso. Este campo deve ser um array de arrays, onde cada subarray contém dois strings: `["Categoria da Recomendação", "Texto da Recomendação"]`. Utilize exclusivamente as categorias listadas abaixo na seção "Restrições de Campos".
8.  Estimativas de SOFA: Se os dados exatos para calcular um componente do escore SOFA (Cardiovascular, Respiratório, Hepático, Renal, Hemato, Neurológico) não estiverem explicitamente declarados (ex: valor de bilirrubina, contagem de plaquetas, PaO2/FiO2), estime a categoria SOFA mais provável com base nos achados clínicos descritos (ex: icterícia, anúria, necessidade de O2, sangramento) e use a opção de valor correspondente da lista abaixo.
9.  Saída Final: A saída deve ser apenas o objeto JSON formatado corretamente, sem nenhum texto explicativo adicional, markdown ou comentários ao redor dele. Retorne APENAS o JSON válido.

Restrições de Campos e Opções Válidas:

* Escala Visual Analógica (for_SAVAS): (Aparece se for_PresencaDor="Sim") Opções: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
* Meta de PAM (Mínima) (for_PAMMin): Opções: 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120
* Meta de PAM (Máxima) (for_MetaMax): Opções: 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120
* Proteína (g/kg) (Não Obeso) (for_NaoObesoProteina): (Aparece se for_PacienteObeso="Não") Opções: 1,2, 1,3, 1,4, 1,5, 1,6, 1,7, 1,8, 1,9, 2,0
* Proteína (g/kg) (Obeso) (for_ObesoProteina): (Aparece se for_PacienteObeso="Sim") Opções: 1,2, 1,3, 1,4, 1,5, 1,6, 1,7, 1,8, 1,9, 2,0
* Justificativa enteral (for_MetaJustificativa): (Aparece se for_MetaAtingida="Não" e via enteral presente) Opções Múltiplas: Em progressão, Intolerância por naúsea e/ou vômitos, Distenção abdominal AE, Íleo adinâmico / Metabólico, Contraindicação cirúrgica, Outros
* Justificativa parenteral (for_MetaJustificativaParenteral): (Aparece se for_MetaAtingida="Não" e via parenteral presente) Opções Múltiplas: Em progressão, Distúrbio metabólico / Eletrolítico, Risco de síndrome de realimentação, Outros
* Recomendações (Classificação) (for_ClassificaoRecomendacoes): (Campo de texto livre após selecionar uma das categorias abaixo)
    * Categorias Válidas:
        * Balanço de fluidos, eletrólitos e função renal - Exames
        * Balanço de fluidos, eletrólitos e função renal - Medicamentos
        * Balanço de fluidos, eletrólitos e função renal - Orientações
        * Condições da pele - Exames
        * Condições da pele - Medicamentos
        * Condições da pele - Orientações
        * Dispositivos e procedimentos - Exames
        * Dispositivos e procedimentos - Medicamentos
        * Dispositivos e procedimentos - Orientações
        * Farmacologia clínica - Exames
        * Farmacologia clínica - Medicamentos
        * Farmacologia clínica - Orientações
        * Fluxo do paciente - Exames
        * Fluxo do paciente - Medicamentos
        * Fluxo do paciente - Orientações
        * Hematológico e infecção - Exames
        * Hematológico e infecção - Medicamentos
        * Hematológico e infecção - Orientações
        * Hemodinâmica - Exames
        * Hemodinâmica - Medicamentos
        * Hemodinâmica - Orientações
        * Mobilização - Exames
        * Mobilização - Medicamentos
        * Mobilização - Orientações
        * Neurológico - Exames
        * Neurológico - Medicamentos
        * Neurológico - Orientações
        * Profilaxias - Exames
        * Profilaxias - Medicamentos
        * Profilaxias - Orientações
        * Respiratório - Exames
        * Respiratório - Medicamentos
        * Respiratório - Orientações
        * Sedação, analgesia e delirium - Exames
        * Sedação, analgesia e delirium - Medicamentos
        * Sedação, analgesia e delirium - Orientações
        * Suporte e gerenciamento de conflito - Exames
        * Suporte e gerenciamento de conflito - Medicamentos
        * Suporte e gerenciamento de conflito - Orientações
        * Suporte nutricional e controle glicêmico - Exames
        * Suporte nutricional e controle glicêmico - Medicamentos
        * Suporte nutricional e controle glicêmico - Orientações
* SOFA Neuro (for_SOFANeurologico): Opções: 15, 13 a 14, 10 a 12, 6 a 9, <6
* Sedação (for_Sedacao): Opções: Sim, Não
* Interrupção/ajuste diária (for_InterrupcaoDiaria): (Aparece se for_Sedacao="Sim") Opções: Sim, Não
* Presença de dor (for_PresencaDor): Opções: Sim, Não
* Delirium Presente? (for_DeliriumPresente): Opções: Não há delirium, Delirium presente
* Uso de vasopressor (for_UsoVasopressor): Opções: Sim, Não
* Uso de Inotrópicos (for_UsoInotropicos): Opções: Sim, Não
* Uso de vasodilatador (for_Vasodilatador): Opções: Sim, Não
* Uso de Antiarritimicos (for_UsoAntiarritimicos): Opções: Sim, Não
* SOFA Cardiovascular (for_SOFACardio): Opções: Sem hipotensão, PAM < 70mmhg, Dopa > 5 ou dobuta qq dose, Dopa >15 ou Nora/Adr > 0.01, Nora/Adr > 0.1
* Candidato a teste respiração espontânea (for_CandidatoTRE): (Aparece se for_SuporteVentilatorio incluir "Ventilação mecânica invasiva") Opções: Sim, Não
* SOFA Respiratória (for_SOFARespiratorio): Opções: >= 400, 300-399, 200-299, 100-199 + suplem. Vent., <100 + suplem. Vent.
* O paciente está sendo nutrido (for_Nutrido): Opções: Sim, Não
* Paciente obeso (for_PacienteObeso): (Aparece se for_ViaNutricao for Enteral/Parenteral) Opções: Sim, Não
* Dieta disponível (densidade calórica) (Não Obeso) (for_NaoObesoDieta): (Aparece se for_PacienteObeso="Não") Opções: 1,0, 1,5
* Dieta disponível (densidade calórica) (Obeso) (for_ObesoDieta): (Aparece se for_PacienteObeso="Sim") Opções: 1,0, 1,5
* Meta atingida (for_MetaAtingida): (Aparece se for_Nutrido="Sim") Opções: Sim, Não
* Eliminações intestinais (for_EliminacoesIntestinais): Opções: Presente, Ausente
* Característica (Eliminações Intestinais) (for_Eliminacoes): (Aparece se for_EliminacoesIntestinais="Presente") Opções: Normal, Fezes líquidas, Melena, Enterorragia
* Quantas dias sem evacuação (for_QuantasSemEvacuacao): (Aparece se for_EliminacoesIntestinais="Ausente") Opções: >= 3 dias, < 3 dias
* O paciente apresentou dois ou mais glicemias > 180 mg/dl em 24 horas? (for_Hipergl): Opções: Sim, Não
* Protocolo de insulina (for_ProtocoloInsulinico): (Aparece se for_Hipergl="Sim") Opções: Subcutâneo, Intravenoso, Nenhum
* Um ou mais controles glicêmicos < 60 mg/dl (for_Hipogl): Opções: Sim, Não
* SOFA Hepático (for_SOFAHepatico): Opções: < 1,2, 1,2 - 1,9, 2,0 - 5,9, 6,0 - 11,9, >= 12
* Alteração Eletrolítica (for_AlteracaoEletrolitica): Opções: Sim, Não
* Em diálise (for_Dialise): Opções: Sim, Não
* Qual o método (Diálise) (for_MetodoDialise): (Aparece se for_Dialise="Sim") Opções: Continua, Intermitente, CAPD
* SOFA Renal (for_SOFARenal): Opções: < 1,2, 1,2 - 1,9, 2,0 - 3,4, 3,5 - 4,9 ou 500ml/24h, >= 5 ou <= 200ml/24h
* Antibioticoterapia (for_AntiTerapia): Opções: Terapêutica, Profilática, Sem antibiótico
* Infecção (for_OpInfeccao): Opções: Sim, Não
* Guiado por cultura? (for_GuiadoCultura): (Aparece se for_OpInfeccao="Sim") Opções: Sim, Não
* SOFA Hemato (for_SOFAHemato): Opções: >= 150, 100 - 149, 50 - 99, 20 - 49, <20
* As drogas foram ajustadas para funçao renal (for_DrogasAjustadas): Opções: Sim, Não, Não se aplica
* Reconciliação medicamentosa (for_ReconciliacaoMedicamentosa): Opções: Total, Parcial, Não, Não se aplica
* Interação Medicamentosa (for_TipoReconciliacaoMedicamentosa): (Aparece se for_ReconciliacaoMedicamentosa="Total" ou "Parcial") Opções: Sim, Não, Não se aplica
* Sonda vesical de demora (for_SVD): Opções: Sim, Não
* Pode ser removido (SVD) (for_SVDRemocao): (Aparece se for_SVD="Sim") Opções: Sim, Não
* Cateter Venoso Central (for_CVC): Opções: Sim, Não
* Pode ser removido (CVC) (for_CVCRemocao): (Aparece se for_CVC="Sim") Opções: Sim, Não
* Há cateter arterial (for_CateterArterial): Opções: Sim, Não
* Pode ser removido (Cateter Arterial) (for_ArterialRemocao): (Aparece se for_CateterArterial="Sim") Opções: Sim, Não
* Há dreno(s) (for_Dreno): Opções: Sim, Não
* Pode ser removido (Dreno) (for_DrenoRemocao): (Aparece se for_Dreno="Sim") Opções: Sim, Não
* Tem indicação de profilaxia gástrica? (for_ProfilaxiaGastrica): Opções: Sim, Não
* Está em uso? (Profilaxia Gástrica) (for_ProfilaxiaEmUSO): Opções: Sim, Não
* Tem indicação de profilaxia de TEV? (for_ProfilaxiaTEV): Opções: Sim, Não
* Está em uso? (Profilaxia TEV) (for_ProfilaxiaTEVEmUSO): Opções: Sim, Não, Contra-indicado
* Paciente pode ser mobilizado? (for_PacienteMobilizado): Opções: Sim, Não
* Pele íntegra (for_PeleIntegra): Opções: Sim, Não
* Lesões de pele (for_LesoesPele): (Aparece se for_PeleIntegra="Não") Opções Múltiplas: UP - Úlcera de pressão, DAI - Dermatite associada a incontinência, Deiscência de ferida operatória, Outro (especificar no texto)
* Limitação terapêutica (for_Limitacao): Opções: Sim, Não
* Paciente pode receber alta (for_AltaPaciente): Opções: Sim, Não
* Paciente necessita de atendimento com a equipe da farmácia? (for_AtendimentoFarmacia): Opções: Sim, Não
* Paciente watcher (for_PacienteWatcher): Opções: Sim, Não

Agora, segue a história clínica:
"""

# --- Helper Function to Parse AI Response ---
def extract_json_from_ai_text(ai_text):
    """Attempts to extract a JSON object from the AI's text response."""
    try:
        # 1. Try direct parsing
        return json.loads(ai_text)
    except json.JSONDecodeError:
        print("Direct JSON parsing failed. Trying code block extraction...")
        # 2. Try extracting from ```json ... ``` code block
        code_block_match = None
        try:
            # Basic regex to find ```json block
            import re
            match = re.search(r'```json\s*(\{.*?\})\s*```', ai_text, re.DOTALL | re.IGNORECASE)
            if match:
                code_block_match = match.group(1)
                return json.loads(code_block_match)
            else: # Try finding just ```{...}```
                 match = re.search(r'```\s*(\{.*?\})\s*```', ai_text, re.DOTALL)
                 if match:
                     code_block_match = match.group(1)
                     return json.loads(code_block_match)

        except json.JSONDecodeError:
            print(f"Parsing JSON from code block failed. Code block content: {code_block_match}")
        except Exception as e:
             print(f"Regex or other error during code block extraction: {e}")


        print("Code block extraction failed. Trying first/last brace...")
        # 3. Try finding the first '{' and last '}'
        try:
            first_brace = ai_text.find('{')
            last_brace = ai_text.rfind('}')
            if first_brace != -1 and last_brace > first_brace:
                potential_json = ai_text[first_brace : last_brace + 1]
                return json.loads(potential_json)
        except json.JSONDecodeError:
            print("Parsing JSON from first/last brace failed.")
            return None # Failed all methods
    return None # Failed all methods


# --- API Endpoint ---
@app.route('/api/process-clinical-history', methods=['POST'])
def process_clinical_history():
    # 1. Get API Key from Environment Variable
    api_key = os.getenv('GOOGLE_AI_API_KEY')
    print(f"Loaded API Key: {'*' * len(api_key) if api_key else 'NOT FOUND'}")  # Debug output
    if not api_key:
        print("ERROR: GOOGLE_AI_API_KEY environment variable not set.")
        return jsonify({"error": "Server configuration error: Missing API Key"}), 500

    # 2. Get Clinical History from Request Body
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    clinical_history = data.get('history')
    if not clinical_history:
        return jsonify({"error": "Missing 'history' field in request body"}), 400

    # 3. Construct Full Prompt
    full_prompt = BASE_AI_PROMPT + "\n" + clinical_history
    # print(f"Sending prompt to AI:\n{full_prompt[:500]}...") # Log start of prompt if needed

    # 4. Call Google AI API (Gemini Pro)
    api_endpoint = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent?key={api_key}"
    request_body = {
        "contents": [{
            "parts": [{"text": full_prompt}]
        }],
         # Add generationConfig or safetySettings if needed, matching JS version if applicable
         # "generationConfig": { ... },
         # "safetySettings": [ ... ]
    }

    headers = {'Content-Type': 'application/json'}

    # Debug output
    print("\n=== Google AI API Request ===")
    print(f"Endpoint: {api_endpoint}")
    print(f"Headers: {headers}")
    print(f"Payload: {json.dumps(request_body, indent=2)}")
    print("=======================\n")

    print("Calling Google AI API...")
    try:
        response = requests.post(api_endpoint, headers=headers, json=request_body, timeout=120) # Added timeout
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)

        ai_response_data = response.json()
        # print("Raw AI Response:", json.dumps(ai_response_data, indent=2)) # Debugging

        # 5. Extract Text and Parse JSON from AI Response
        if not ai_response_data.get('candidates') or not ai_response_data['candidates'][0].get('content') or not ai_response_data['candidates'][0]['content'].get('parts'):
             # Check for safety blocks or other issues
             finish_reason = ai_response_data.get('candidates', [{}])[0].get('finishReason', 'UNKNOWN')
             block_reason = ai_response_data.get('promptFeedback', {}).get('blockReason')
             if finish_reason == 'SAFETY':
                 return jsonify({"error": "AI response blocked due to safety settings."}), 500
             if block_reason:
                  return jsonify({"error": f"AI prompt blocked. Reason: {block_reason}"}), 500
             print("ERROR: Unexpected AI response structure:", ai_response_data)
             return jsonify({"error": "Invalid response structure from AI API"}), 500

        ai_text = ai_response_data['candidates'][0]['content']['parts'][0].get('text', '')
        print(f"AI Text Received (first 500 chars): {ai_text[:500]}...")

        parsed_json = extract_json_from_ai_text(ai_text)

        if parsed_json is None:
            print("ERROR: Failed to extract valid JSON from AI response text.")
            # Optionally return the raw text for debugging on the client? Risky.
            return jsonify({"error": "Failed to parse structured data from AI response"}), 500

        print("Successfully parsed JSON from AI.")
        # 6. Return Parsed JSON to Frontend
        return jsonify({"formData": parsed_json}), 200

    except requests.exceptions.RequestException as e:
        print(f"ERROR: Network or HTTP error calling Google AI API: {e}")
        return jsonify({"error": f"Failed to communicate with AI service: {e}"}), 502 # Bad Gateway
    except Exception as e:
        print(f"ERROR: An unexpected error occurred: {e}")
        # Log the full exception traceback here in a real application
        return jsonify({"error": "An unexpected server error occurred"}), 500


# --- Run the Flask App ---
if __name__ == '__main__':
    # Use 0.0.0.0 to make it accessible on the network if needed,
    # otherwise 127.0.0.1 is safer for local development.
    # Debug=True enables auto-reloading and provides more detailed errors,
    # BUT DO NOT USE debug=True IN PRODUCTION.
    app.run(host='127.0.0.1', port=5001, debug=True)