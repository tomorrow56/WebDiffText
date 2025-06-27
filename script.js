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
        
        this.initializeEventListeners();
        this.setupDragAndDrop();
    }

    /**
     * イベントリスナーを初期化
     */
    initializeEventListeners() {
        const file1Input = document.getElementById('file1');
        const file2Input = document.getElementById('file2');
        const compareBtn = document.getElementById('compare-btn');
        const downloadBtn = document.getElementById('download-btn');

        // ファイル選択イベント
        file1Input.addEventListener('change', (e) => this.handleFileSelect(e, 1));
        file2Input.addEventListener('change', (e) => this.handleFileSelect(e, 2));
        
        // 比較ボタンイベント
        compareBtn.addEventListener('click', () => this.performDiff());
        
        // ダウンロードボタンイベント
        downloadBtn.addEventListener('click', () => this.downloadHTML());
    }

    /**
     * ドラッグ＆ドロップ機能のセットアップ
     */
    setupDragAndDrop() {
        const containers = document.querySelectorAll('.textarea-container');

        containers.forEach(container => {
            const textarea = container.querySelector('textarea');

            // デフォルトの動作を無効化
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                container.addEventListener(eventName, preventDefaults, false);
            });

            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            // ドラッグオーバー時のハイライト
            ['dragenter', 'dragover'].forEach(eventName => {
                container.addEventListener(eventName, () => {
                    container.classList.add('drag-over');
                }, false);
            });

            // ドラッグリーブ時、ドロップ時のハイライト解除
            ['dragleave', 'drop'].forEach(eventName => {
                container.addEventListener(eventName, () => {
                    container.classList.remove('drag-over');
                }, false);
            });

            // ドロップ処理
            container.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;

                if (files.length > 0) {
                    const file = files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        textarea.value = event.target.result;
                    };
                    reader.onerror = () => {
                        alert('ファイルの読み込みに失敗しました。');
                    };
                    reader.readAsText(file);
                }
            }, false);
        });
    }

    /**
     * ファイル選択処理
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
            this.showError(`ファイル読み込みエラー: ${error.message}`);
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
        const infoElement = document.getElementById(`file${fileNumber}-info`);
        const fileSize = this.formatFileSize(file.size);
        const lastModified = new Date(file.lastModified).toLocaleString('ja-JP');
        
        infoElement.innerHTML = `
            <strong>${file.name}</strong><br>
            サイズ: ${fileSize}<br>
            更新日時: ${lastModified}
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
        } else {
            this.file2Content = null;
            this.file2Name = '';
        }
        
        const infoElement = document.getElementById(`file${fileNumber}-info`);
        infoElement.style.display = 'none';
        
        this.updateCompareButtonState();
    }

    /**
     * 比較ボタンの状態を更新
     */
    updateCompareButtonState() {
        const compareBtn = document.getElementById('compare-btn');
        const canCompare = this.file1Content !== null && this.file2Content !== null;
        
        compareBtn.disabled = !canCompare;
    }

    /**
     * 差分比較を実行
     */
    async performDiff() {
        const diffContainer = document.getElementById('diff-container');
        const resultSection = document.getElementById('result-section');
        
        // ローディング表示
        diffContainer.innerHTML = '<div class="loading">差分を計算中...</div>';
        resultSection.style.display = 'block';
        
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
            this.showError(`差分計算エラー: ${error.message}`);
        }
    }

    /**
     * 差分結果を表示
     * @param {Array} diffResult - 差分結果
     */
    displayDiffResult(diffResult) {
        const diffContainer = document.getElementById('diff-container');
        
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
        
        diffContainer.innerHTML = html;
    }

    /**
     * HTMLをダウンロード
     */
    downloadHTML() {
        if (!this.currentDiffHTML) {
            this.showError('ダウンロードするデータがありません。まず差分を表示してください。');
            return;
        }
        
        const blob = new Blob([this.currentDiffHTML], { type: 'text/html; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `diff_${this.file1Name}_vs_${this.file2Name}_${this.getTimestamp()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * タイムスタンプを取得
     * @returns {string} タイムスタンプ文字列
     */
    getTimestamp() {
        const now = new Date();
        return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    }

    /**
     * HTMLエスケープ
     * @param {string} text - エスケープするテキスト
     * @returns {string} エスケープ済みテキスト
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * エラーメッセージを表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        alert(message);
        console.error(message);
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.diffViewerApp = new DiffViewerApp();
});

