/**
 * テキスト差分表示アルゴリズム
 * シンプルな行ベースの差分計算を実装
 */

class DiffCalculator {
    constructor() {
        this.diffTypes = {
            NORMAL: 'normal',
            ADDED: 'added',
            REMOVED: 'removed',
            MODIFIED: 'modified',
            EMPTY: 'empty'
        };
    }

    /**
     * 2つのテキストの差分を計算
     * @param {string} text1 - 左側のテキスト
     * @param {string} text2 - 右側のテキスト
     * @returns {Array} 差分結果の配列
     */
    calculateDiff(text1, text2) {
        const lines1 = text1.split('\n');
        const lines2 = text2.split('\n');
        
        // LCS (Longest Common Subsequence) を使用した差分計算
        const lcs = this.calculateLCS(lines1, lines2);
        return this.generateDiffResult(lines1, lines2, lcs);
    }

    /**
     * LCS (Longest Common Subsequence) を計算
     * @param {Array} lines1 - 左側の行配列
     * @param {Array} lines2 - 右側の行配列
     * @returns {Array} LCS結果
     */
    calculateLCS(lines1, lines2) {
        const m = lines1.length;
        const n = lines2.length;
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

        // DPテーブルを構築
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (lines1[i - 1] === lines2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        // LCSを逆算
        const lcs = [];
        let i = m, j = n;
        while (i > 0 && j > 0) {
            if (lines1[i - 1] === lines2[j - 1]) {
                lcs.unshift({ i1: i - 1, i2: j - 1, line: lines1[i - 1] });
                i--;
                j--;
            } else if (dp[i - 1][j] > dp[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }

        return lcs;
    }

    /**
     * 差分結果を生成
     * @param {Array} lines1 - 左側の行配列
     * @param {Array} lines2 - 右側の行配列
     * @param {Array} lcs - LCS結果
     * @returns {Array} 差分結果
     */
    generateDiffResult(lines1, lines2, lcs) {
        const result = [];
        let i1 = 0, i2 = 0, lcsIndex = 0;

        while (i1 < lines1.length || i2 < lines2.length) {
            if (lcsIndex < lcs.length && 
                i1 === lcs[lcsIndex].i1 && 
                i2 === lcs[lcsIndex].i2) {
                // 共通行
                result.push({
                    type: this.diffTypes.NORMAL,
                    leftLine: i1 + 1,
                    rightLine: i2 + 1,
                    leftContent: lines1[i1],
                    rightContent: lines2[i2]
                });
                i1++;
                i2++;
                lcsIndex++;
            } else if (i1 < lines1.length && 
                       (lcsIndex >= lcs.length || i1 < lcs[lcsIndex].i1)) {
                // 左側のみの行（削除）
                result.push({
                    type: this.diffTypes.REMOVED,
                    leftLine: i1 + 1,
                    rightLine: null,
                    leftContent: lines1[i1],
                    rightContent: ''
                });
                i1++;
            } else if (i2 < lines2.length && 
                       (lcsIndex >= lcs.length || i2 < lcs[lcsIndex].i2)) {
                // 右側のみの行（追加）
                result.push({
                    type: this.diffTypes.ADDED,
                    leftLine: null,
                    rightLine: i2 + 1,
                    leftContent: '',
                    rightContent: lines2[i2]
                });
                i2++;
            }
        }

        return result;
    }

    /**
     * 差分結果をHTML形式で生成
     * @param {Array} diffResult - 差分結果
     * @param {string} filename1 - 左側ファイル名
     * @param {string} filename2 - 右側ファイル名
     * @returns {string} HTML文字列
     */
    generateHTML(diffResult, filename1, filename2) {
        const timestamp = new Date().toLocaleString('ja-JP');
        
        let html = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
    "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>テキストファイル差分表示結果</title>
<style type="text/css">
<!--
td,th {word-break: break-all; font-size: 12pt;}
tr { vertical-align: top; }
.border { border-radius: 6px; border: 1px #a0a0a0 solid; box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.15); overflow: hidden; }
.ln {text-align: right; word-break: normal; background-color: lightgrey; box-shadow: inset 1px 0px 0px rgba(0, 0, 0, 0.10); min-width: 40px;}
.title {color: white; background-color: blue; vertical-align: top; padding: 4px 4px; background: linear-gradient(mediumblue, darkblue);}
.line-normal {color: #000000; background-color: #ffffff;}
.line-added {color: #000000; background-color: #c8f7c5;}
.line-removed {color: #000000; background-color: #ffb3ba;}
.line-modified {color: #000000; background-color: #fff2cc;}
.line-empty {color: #999999; background-color: #f0f0f0;}
-->
</style>
</head>
<body>
<h2>テキストファイル差分表示結果</h2>
<p>生成日時: ${timestamp}</p>
<div class="border">
<table cellspacing="0" cellpadding="0" style="width: 100%; margin: 0; border: none;">
<thead>
<tr>
<th class="title" style="width:1%"></th>
<th class="title" style="width:49%">${this.escapeHtml(filename1)}</th>
<th class="title" style="width:1%"></th>
<th class="title" style="width:49%">${this.escapeHtml(filename2)}</th>
</tr>
</thead>
<tbody>`;

        diffResult.forEach(diff => {
            const leftLineNum = diff.leftLine || '';
            const rightLineNum = diff.rightLine || '';
            const leftContent = this.escapeHtml(diff.leftContent);
            const rightContent = this.escapeHtml(diff.rightContent);
            
            let cssClass;
            switch (diff.type) {
                case this.diffTypes.ADDED:
                    cssClass = 'line-added';
                    break;
                case this.diffTypes.REMOVED:
                    cssClass = 'line-removed';
                    break;
                case this.diffTypes.MODIFIED:
                    cssClass = 'line-modified';
                    break;
                default:
                    cssClass = 'line-normal';
            }

            html += `
<tr>
<td class="ln">${leftLineNum}</td>
<td class="${cssClass}"><code>${leftContent || '&nbsp;'}</code></td>
<td class="ln">${rightLineNum}</td>
<td class="${cssClass}"><code>${rightContent || '&nbsp;'}</code></td>
</tr>`;
        });

        html += `
</tbody>
</table>
</div>
</body>
</html>`;

        return html;
    }

    /**
     * HTMLエスケープ
     * @param {string} text - エスケープするテキスト
     * @returns {string} エスケープ済みテキスト
     */
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// グローバルに公開
window.DiffCalculator = DiffCalculator;

