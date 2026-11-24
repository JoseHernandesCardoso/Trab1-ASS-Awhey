# AGENTS.md

## Visao Geral
O projeto do Away é um sistema que visa facilitar a criação de grupos de treino
orientados por professores e orientações diretas de um professor com um aluno.

## Objetivo Final
Implementar o caso de uso UC-01: Criar Turma modelado em ./projeto/Casos\ de\ Uso.pdf

Não deve ser feito mais que o necessário para a implementação desse caso.

## Tecnologias
 - Front-end: React
 - Back-end: Node.js
 - Banco de Dados: sqlite

## Instrucoes para o Agente
 - Implemente apenas o que for solicitado pelo usuário
 - Simplifique o código para que funcione apenas o essencial
 - Toda a modelagem do projeto está presente nos PDFs em ./projeto

## Comandos
Todos os comandos devem ser executados a partir da raiz do repositório:
`/home/josehernandes/Documents/UEM/ADSS/implementacao_caso_de_uso`.

### Verificar o ambiente
```bash
node --version
npm --version
git status --short
```

### Consultar a modelagem
```bash
pdftotext -layout "projeto/Casos de Uso.pdf" -
pdftotext -layout "projeto/Requisitos Funcionais.pdf" -
pdftotext -layout "projeto/Regras de Negocio.pdf" -
pdftotext -layout "projeto/diagrama_de_classes.pdf" -
```

### Instalar dependências
```bash
npm install
```

Se o projeto for separado em diretórios de front-end e back-end, executar
`npm install` em cada diretório que possuir um `package.json`.

### Desenvolvimento
```bash
npm run dev
```

Quando front-end e back-end possuírem comandos separados, iniciar cada um em
um terminal próprio usando o script `dev` do respectivo `package.json`.

### Validar alterações
```bash
npm test
npm run build
```

Executar apenas os scripts existentes no `package.json`. Antes de concluir uma
alteração, verificar também os arquivos modificados com:

```bash
git diff --check
git status --short
```
