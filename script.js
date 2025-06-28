/**
 * テキストファイル差分表示ツール - メインスクリプト
 */

class DiffViewerApp {
    constructor() {
        this.file1Content = null;
        this.file2Content = null;
        this.file1Name = '';
        this.file2Name = '';
        this.diffCalculator = new DiffCalculator();
        this.currentDiffHTML = '';
        this.currentLang = 'ja';

        // DOM要素をプロパティとして保持
        this.fileInput1 = document.getElementById('file1');
        this.fileInput2 = document.getElementById('file2');
        this.fileInfo1 = document.getElementById('file1-info');
        this.fileInfo2 = document.getElementById('file2-info');
        this.dropArea1 = document.getElementById('drop-area-1');
        this.dropArea2 = document.getElementById('drop-area-2');
        this.compareBtn = document.getElementById('compare-btn');
        this.diffContainer = document.getElementById('diff-container');
        this.resultSection = document.getElementById('result-section');
        
        this.initializeEventListeners();
        this.updateUI();
    }

    /**
     * UIテキスト
     */
    uiText = {
        ja: {
            title: "テキストファイル差分表示ツール",
            description: "2つのテキストファイルをアップロードして差分を表示します",
            leftFile: "左側のファイルを選択",
            rightFile: "右側のファイルを選択",
            selectFile: "ファイルを選択",
            compare: "差分を表示する",
            clear: "クリア",
            resultTitle: "差分表示結果",
            download: "HTMLをダウンロード",
            noDiff: "差分はありません",
            loading: "差分を計算中...",
            fileReadError: "ファイル読み込みエラー",
            diffError: "差分計算エラー",
            noResult: "比較結果がありません。",
            fileSize: "サイズ",
            lastModified: "更新日時",
        },
        en: {
            title: "Text File Diff Viewer",
            description: "Upload two text files to display the differences.",
            leftFile: "Select Left File",
            rightFile: "Select Right File",
            selectFile: "Select File",
            compare: "Show Differences",
            clear: "Clear",
            resultTitle: "Difference Result",
            download: "Download HTML",
            noDiff: "No differences.",
            loading: "Calculating differences...",
            fileReadError: "File read error",
            diffError: "Difference calculation error",
            noResult: "No comparison result.",
            fileSize: "Size",
            lastModified: "Last Modified",
        }
    };

    /**
     * イベントリスナーを初期化
     */
    initializeEventListeners() {
        const downloadBtn = document.getElementById('download-btn');
        const clearBtn = document.getElementById('clear-diff-btn');

        // ファイル選択イベント
        this.fileInput1.addEventListener('change', (e) => this.handleFileSelect(e, 1));
        this.fileInput2.addEventListener('change', (e) => this.handleFileSelect(e, 2));

        // 比較ボタンイベント
        this.compareBtn.addEventListener('click', () => this.compareFiles());
        
        // ダウンロードボタンイベント
        downloadBtn.addEventListener('click', () => this.downloadHTML());

        // クリアボタンイベント
        clearBtn.addEventListener('click', () => {
            this.diffContainer.innerHTML = '';
            this.resultSection.style.display = 'none';
            this.fileInput1.value = ''; // Reset file input
            this.fileInput2.value = ''; // Reset file input
            this.clearFileData(1);
            this.clearFileData(2);
        });

        // Drag and drop イベント
        this.setupDragAndDrop(this.dropArea1, 1);
        this.setupDragAndDrop(this.dropArea2, 2);

        // 言語選択イベント
        document.querySelectorAll('input[name="language"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentLang = e.target.value;
                this.updateUI();
            });
        });
    }

    /**
     * UIを更新
     */
    updateUI() {
        const t = this.uiText[this.currentLang];
        document.querySelector('header h1').textContent = t.title;
        document.querySelector('header p').textContent = t.description;
        this.dropArea1.querySelector('label[for="file1"]').textContent = t.leftFile;
        this.dropArea1.querySelector('.file-input-label').textContent = t.selectFile;
        this.dropArea2.querySelector('label[for="file2"]').textContent = t.rightFile;
        this.dropArea2.querySelector('.file-input-label').textContent = t.selectFile;
        this.compareBtn.textContent = t.compare;
        document.getElementById('clear-diff-btn').textContent = t.clear;
        document.querySelector('.result-header h2').textContent = t.resultTitle;
        document.getElementById('download-btn').textContent = t.download;
    }

    setupDragAndDrop(dropArea, fileNumber) {
        // デフォルトの動作を無効化
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // ドラッグオーバー時のハイライト
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => this.highlight(dropArea), false);
        });

        // ドラッグリーブ時、ドロップ時のハイライト解除
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => this.unhighlight(dropArea), false);
        });

        // ドロップ処理
        dropArea.addEventListener('drop', (e) => this.handleDrop(e, fileNumber), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(element) {
        element.classList.add('drag-over');
    }

    unhighlight(element) {
        element.classList.remove('drag-over');
    }

    handleDrop(e, fileNumber) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            // ドロップされたファイルを input に設定して change イベントを発火させる
            const inputElement = fileNumber === 1 ? this.fileInput1 : this.fileInput2;
            inputElement.files = files;
            const changeEvent = new Event('change', { bubbles: true });
            inputElement.dispatchEvent(changeEvent);
        }
    }

    /**
     * ファイル選択時の処理
     * @param {Event} event - ファイル選択イベント
     * @param {number} fileNumber - ファイル番号（1または2）
     */
    async handleFileSelect(event, fileNumber) {
        const file = event.target.files[0];
        if (!file) {
            this.clearFileData(fileNumber);
            return;
        }

        // ファイル情報を表示
        this.displayFileInfo(file, fileNumber);

        try {
            const content = await this.readFileContent(file);
            
            if (fileNumber === 1) {
                this.file1Content = content;
                this.file1Name = file.name;
            } else {
                this.file2Content = content;
                this.file2Name = file.name;
            }

            // 両方のファイルが選択されたら比較ボタンを有効化
            this.updateCompareButtonState();
            
        } catch (error) {
            this.showError(`${this.uiText[this.currentLang].fileReadError}: ${error.message}`);
            this.clearFileData(fileNumber);
        }
    }

    /**
     * ファイル内容を読み込み
     * @param {File} file - 読み込むファイル
     * @returns {Promise<string>} ファイル内容
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('ファイルの読み込みに失敗しました'));
            };
            
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * ファイル情報を表示
     * @param {File} file - ファイルオブジェクト
     * @param {number} fileNumber - ファイル番号
     */
    displayFileInfo(file, fileNumber) {
        const infoElement = fileNumber === 1 ? this.fileInfo1 : this.fileInfo2;
        const fileSize = this.formatFileSize(file.size);
        const lastModified = new Date(file.lastModified).toLocaleString(this.currentLang);
        
        infoElement.innerHTML = `
            <strong>${this.escapeHtml(file.name)}</strong><br>
            ${this.uiText[this.currentLang].fileSize}: ${fileSize}<br>
            ${this.uiText[this.currentLang].lastModified}: ${lastModified}
        `;
        infoElement.style.display = 'block';
    }

    /**
     * ファイルサイズをフォーマット
     * @param {number} bytes - バイト数
     * @returns {string} フォーマット済みサイズ
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * ファイルデータをクリア
     * @param {number} fileNumber - ファイル番号
     */
    clearFileData(fileNumber) {
        if (fileNumber === 1) {
            this.file1Content = null;
            this.file1Name = '';
            this.fileInfo1.style.display = 'none';
            this.fileInfo1.innerHTML = '';
        } else {
            this.file2Content = null;
            this.file2Name = '';
            this.fileInfo2.style.display = 'none';
            this.fileInfo2.innerHTML = '';
        }
        
        this.updateCompareButtonState();
    }

    /**
     * 比較ボタンの状態を更新
     */
    updateCompareButtonState() {
        this.compareBtn.disabled = !(this.file1Content !== null && this.file2Content !== null);
    }

    /**
     * 差分比較を実行
     */
    async compareFiles() {
        // ローディング表示
        this.diffContainer.innerHTML = `<div class="loading message-box">${this.uiText[this.currentLang].loading}</div>`;
        this.resultSection.style.display = 'block';
        
        try {
            // 少し遅延を入れてローディングを表示
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 差分計算
            const diffResult = this.diffCalculator.calculateDiff(
                this.file1Content, 
                this.file2Content
            );
            
            // 結果表示
            this.displayDiffResult(diffResult);
            
            // HTML生成（ダウンロード用）
            this.currentDiffHTML = this.diffCalculator.generateHTML(
                diffResult, 
                this.file1Name, 
                this.file2Name
            );
            
        } catch (error) {
            this.showError(`${this.uiText[this.currentLang].diffError}: ${error.message}`);
        }
    }

    /**
     * 差分結果を表示
     * @param {Array} diffResult - 差分結果
     */
    displayDiffResult(diffResult) {
        const hasChanges = diffResult.some(diff => ['added', 'removed', 'modified'].includes(diff.type));

        if (!hasChanges) {
            alert(this.uiText[this.currentLang].noDiff);
            this.diffContainer.innerHTML = `<div class="no-diff-message message-box">${this.uiText[this.currentLang].noDiff}</div>`;
            return;
        }

        let html = `
        <table class="diff-table">
            <thead>
                <tr>
                    <th class="line-number"></th>
                    <th style="width: 49%">${this.escapeHtml(this.file1Name)}</th>
                    <th class="line-number"></th>
                    <th style="width: 49%">${this.escapeHtml(this.file2Name)}</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        diffResult.forEach(diff => {
            const leftLineNum = diff.leftLine || '';
            const rightLineNum = diff.rightLine || '';
            const leftContent = this.escapeHtml(diff.leftContent);
            const rightContent = this.escapeHtml(diff.rightContent);
            
            let cssClass;
            switch (diff.type) {
                case 'added':
                    cssClass = 'line-added';
                    break;
                case 'removed':
                    cssClass = 'line-removed';
                    break;
                case 'modified':
                    cssClass = 'line-modified';
                    break;
                default:
                    cssClass = 'line-normal';
            }
            
            html += `
                <tr>
                    <td class="line-number">${leftLineNum}</td>
                    <td class="code-content ${cssClass}">${leftContent || '&nbsp;'}</td>
                    <td class="line-number">${rightLineNum}</td>
                    <td class="code-content ${cssClass}">${rightContent || '&nbsp;'}</td>
                </tr>
            `;
        });
        
        html += `
            </tbody>
        </table>
        `;
        
        this.diffContainer.innerHTML = html;
    }

    /**
     * 差分結果をHTMLファイルとしてダウンロード
     */
    downloadHTML() {
        if (!this.currentDiffHTML) {
            alert(this.uiText[this.currentLang].noResult);
            return;
        }

        const blob = new Blob([this.currentDiffHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diff_result.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * エラーメッセージを表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        console.error(message);
        alert(message);
        this.diffContainer.innerHTML = `<div class="error-message message-box">${this.escapeHtml(message)}</div>`;
    }

    /**
     * HTML特殊文字をエスケープ
     * @param {string} str - 対象文字列
     * @returns {string} エスケープ後の文字列
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, function(match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }
}

// アプリケーションのインスタンスを作成
document.addEventListener('DOMContentLoaded', () => {
    new DiffViewerApp();
});