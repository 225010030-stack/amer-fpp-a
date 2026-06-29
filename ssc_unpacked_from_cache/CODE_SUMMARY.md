# SSC Console Code Summary

## Entry And Architecture
- Entry page: `index.original.html`
- UI framework: Vue 3 (`vendor/vue.global.prod.js`) + TDesign (`vendor/tdesign.min.js`, `vendor/tdesign.min.css`)
- Utility libraries: lodash, JSZip, PDF.js, Mammoth, docx, FileSaver, PptxGenJS
- Feature data for PPT templates and thumbnails is loaded by:
  - `ppt-templates.js`
  - `ppt-thumbs.js`

## Extracted Inline Scripts
- `inline/inline-script-01.js`
  - Global runtime error capture and bottom-page diagnostic panel.
- `inline/inline-script-02.js`
  - PDF.js worker path binding (`vendor/pdf.worker.min.js`).
- `inline/inline-script-03.js`
  - Main application logic:
    - panel/workspace state management
    - AI summary and content workflows
    - meeting/task/assignment interactions
    - PPT generation, preview, save, share, and export
    - document parsing (pdf/docx/pptx) and summary output

## Extracted Inline Styles
- `styles/inline-style-01.css`
  - Main layout and component style rules.
- `styles/inline-style-02.css`
  - Additional UI state and module styles.
- `styles/inline-style-03.css`
  - Supplemental style block (runtime-generated and/or specialized views).

## Dependency Recovery Status
- All external references required by `index.original.html` are now present locally.
- External refs: 13
- Missing refs: 0
