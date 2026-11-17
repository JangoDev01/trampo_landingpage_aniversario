# Convite de aniversário da Clara

Landing page estática para um aniversário infantil, com detalhes da festa, mensagem, galeria de fotos e confirmação de presença.

## Executar localmente

Na pasta do projeto, execute:

```powershell
py -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Personalizar

- Textos, fotos e detalhes da festa estão em `index.html`.
- Paleta e layout estão em `styles.css`.
- O comportamento do RSVP e a geração local do PDF estão em `script.js`. Ao confirmar, o navegador tenta abrir o PDF ilustrado em outra aba e oferece links explícitos para abrir ou baixar o arquivo.
- O formulário não envia nem armazena os dados: a confirmação e o código são gerados no navegador. Para receber as confirmações, será necessário integrar um backend.

Os dados atuais são de exemplo e serão substituídos antes da publicação.
