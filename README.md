# Text File Diff Viewer

A web application that displays the differences between two text files side by side.

## Features

- **File Upload**: Upload two text files by drag & drop or file selection.
- **Diff Display**: Displays line-based differences in two panes.
- **Multi-language Support**: Switch between Japanese and English display.
- **Color-coded Display**:
  - 🟢 Green: Added lines
  - 🔴 Red: Deleted lines
  - 🟡 Yellow: Modified lines
  - ⚪ White: Unchanged lines
- **HTML Download**: Download the diff result as an HTML file.
- **Responsive Design**: Supports both desktop and mobile.

## File Structure

```
diff_viewer/
├── index.html          # Main HTML file
├── styles.css          # Stylesheet
├── script.js           # Main JavaScript file
├── diff-algorithm.js   # Diff calculation algorithm
├── README.md           # This file (English)
└── README_j.md         # README file (Japanese)
```

## How to Use

1. Open `index.html` in your browser.

2. **Select Language**
   - Select Japanese or English using the language selection buttons in the header.

3. **Upload Files**
   - Drag and drop files into the "Select Left File" and "Select Right File" areas, or click the "Select File" button to select files.
   - Supported file formats: .txt, .js, .html, .css, .py, .java, .c, .cpp, .h, .cs, .php, .rb, .go, .rs, .swift, .kt, .ts, .json, .xml, .yaml, .md

4. **Show Differences**
   - Click the "Show Differences" button to display the differences in two panes.

5. **Download HTML**
   - Click the "Download HTML" button to download the diff result as an HTML file.

## Technical Specifications

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Diff Algorithm**: Line comparison based on LCS (Longest Common Subsequence)
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Characteristics

- **Client-side Processing**: All processing is completed in the browser, so files are not sent to the server and privacy is protected.
- **Modern UI**: Provides a clean and intuitive user interface.
