class WebsiteBuilder {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.selectedElement = null;
        this.elements = [];
        this.elementCounter = 0;
        
        this.initializeEventListeners();
        this.setupDragAndDrop();
    }

    initializeEventListeners() {
        // Header buttons
        document.getElementById('previewBtn').addEventListener('click', () => this.showPreview());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportHTML());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        
        // Modal
        document.getElementById('closePreview').addEventListener('click', () => this.hidePreview());
        document.getElementById('previewModal').addEventListener('click', (e) => {
            if (e.target.id === 'previewModal') this.hidePreview();
        });

        // Canvas click to deselect
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas || e.target.classList.contains('canvas-placeholder')) {
                this.deselectElement();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedElement) {
                this.deleteElement(this.selectedElement);
            }
            if (e.key === 'Escape') {
                this.deselectElement();
            }
        });
    }

    setupDragAndDrop() {
        const elementItems = document.querySelectorAll('.element-item');
        
        elementItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.canvas.classList.add('dragover');
        });

        this.canvas.addEventListener('dragleave', (e) => {
            if (!this.canvas.contains(e.relatedTarget)) {
                this.canvas.classList.remove('dragover');
            }
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.classList.remove('dragover');
            
            const elementType = e.dataTransfer.getData('text/plain');
            if (elementType) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.createElement(elementType, x, y);
            }
        });
    }

    createElement(type, x, y) {
        const element = document.createElement('div');
        element.className = 'canvas-element';
        element.dataset.elementId = `element-${++this.elementCounter}`;
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        
        let content;
        switch (type) {
            case 'text':
                content = document.createElement('p');
                content.textContent = 'Edit this text';
                content.style.margin = '0';
                content.style.fontSize = '16px';
                content.style.color = '#374151';
                element.appendChild(content);
                break;
                
            case 'heading':
                content = document.createElement('h2');
                content.textContent = 'Heading';
                content.style.margin = '0';
                content.style.fontSize = '24px';
                content.style.color = '#1e293b';
                content.style.fontWeight = '600';
                element.appendChild(content);
                break;
                
            case 'button':
                content = document.createElement('button');
                content.textContent = 'Click Me';
                content.style.padding = '8px 16px';
                content.style.fontSize = '14px';
                content.style.backgroundColor = '#3b82f6';
                content.style.color = 'white';
                content.style.border = 'none';
                content.style.borderRadius = '6px';
                content.style.cursor = 'pointer';
                element.appendChild(content);
                break;
                
            case 'image':
                content = document.createElement('img');
                content.src = 'https://via.placeholder.com/200x150/667eea/ffffff?text=Image';
                content.style.maxWidth = '200px';
                content.style.height = 'auto';
                content.style.display = 'block';
                element.appendChild(content);
                break;
                
            case 'divider':
                content = document.createElement('hr');
                content.style.width = '100%';
                content.style.border = 'none';
                content.style.height = '2px';
                content.style.backgroundColor = '#e2e8f0';
                content.style.margin = '10px 0';
                element.appendChild(content);
                break;
        }

        this.canvas.appendChild(element);
        this.elements.push(element);
        
        this.makeElementDraggable(element);
        this.makeElementSelectable(element);
        this.selectElement(element);
        
        // Hide placeholder if it exists
        const placeholder = this.canvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }

    makeElementDraggable(element) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        const startDrag = (e) => {
            if (e.target !== element && !element.contains(e.target)) return;
            
            isDragging = true;
            const rect = element.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            
            startX = e.clientX;
            startY = e.clientY;
            startLeft = rect.left - canvasRect.left;
            startTop = rect.top - canvasRect.top;
            
            element.style.zIndex = '1000';
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
        };

        const drag = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            // Constrain to canvas bounds
            const canvasRect = this.canvas.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            newLeft = Math.max(0, Math.min(newLeft, canvasRect.width - elementRect.width));
            newTop = Math.max(0, Math.min(newTop, canvasRect.height - elementRect.height));
            
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        };

        const stopDrag = () => {
            isDragging = false;
            element.style.zIndex = '';
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        };

        element.addEventListener('mousedown', startDrag);
        
        // Touch support
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            element.dispatchEvent(mouseEvent);
        }, { passive: false });
    }

    makeElementSelectable(element) {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectElement(element);
        });
    }

    selectElement(element) {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }
        
        this.selectedElement = element;
        element.classList.add('selected');
        this.showProperties(element);
    }

    deselectElement() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
            this.selectedElement = null;
        }
        this.hideProperties();
    }

    deleteElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
            this.elements = this.elements.filter(el => el !== element);
            
            if (this.selectedElement === element) {
                this.deselectElement();
            }
            
            // Show placeholder if no elements left
            if (this.elements.length === 0) {
                const placeholder = this.canvas.querySelector('.canvas-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'block';
                }
            }
        }
    }

    showProperties(element) {
        const propertiesForm = document.getElementById('propertiesForm');
        const elementType = this.getElementType(element);
        
        let html = '<form id="elementProperties">';
        
        switch (elementType) {
            case 'text':
            case 'heading':
                const textContent = element.querySelector('p, h1, h2, h3, h4, h5, h6');
                html += `
                    <div class="form-group">
                        <label for="textContent">Text Content</label>
                        <textarea id="textContent" rows="3">${textContent.textContent}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="fontSize">Font Size (px)</label>
                        <input type="number" id="fontSize" value="${parseInt(textContent.style.fontSize) || 16}" min="8" max="72">
                    </div>
                    <div class="form-group">
                        <label for="textColor">Text Color</label>
                        <input type="color" id="textColor" value="${this.rgbToHex(textContent.style.color) || '#374151'}">
                    </div>
                    <div class="form-group">
                        <label for="fontWeight">Font Weight</label>
                        <select id="fontWeight">
                            <option value="400" ${textContent.style.fontWeight === '400' ? 'selected' : ''}>Normal</option>
                            <option value="600" ${textContent.style.fontWeight === '600' ? 'selected' : ''}>Semi Bold</option>
                            <option value="700" ${textContent.style.fontWeight === '700' ? 'selected' : ''}>Bold</option>
                        </select>
                    </div>
                `;
                break;
                
            case 'button':
                const button = element.querySelector('button');
                html += `
                    <div class="form-group">
                        <label for="buttonText">Button Text</label>
                        <input type="text" id="buttonText" value="${button.textContent}">
                    </div>
                    <div class="form-group">
                        <label for="buttonBgColor">Background Color</label>
                        <input type="color" id="buttonBgColor" value="${this.rgbToHex(button.style.backgroundColor) || '#3b82f6'}">
                    </div>
                    <div class="form-group">
                        <label for="buttonTextColor">Text Color</label>
                        <input type="color" id="buttonTextColor" value="${this.rgbToHex(button.style.color) || '#ffffff'}">
                    </div>
                    <div class="form-group">
                        <label for="buttonPadding">Padding (px)</label>
                        <input type="number" id="buttonPadding" value="${parseInt(button.style.padding) || 8}" min="4" max="32">
                    </div>
                    <div class="form-group">
                        <label for="buttonBorderRadius">Border Radius (px)</label>
                        <input type="number" id="buttonBorderRadius" value="${parseInt(button.style.borderRadius) || 6}" min="0" max="50">
                    </div>
                `;
                break;
                
            case 'image':
                const img = element.querySelector('img');
                html += `
                    <div class="form-group">
                        <label for="imageUrl">Image URL</label>
                        <input type="url" id="imageUrl" value="${img.src}">
                    </div>
                    <div class="form-group">
                        <label for="imageWidth">Width (px)</label>
                        <input type="number" id="imageWidth" value="${parseInt(img.style.maxWidth) || 200}" min="50" max="800">
                    </div>
                    <div class="form-group">
                        <label for="imageAlt">Alt Text</label>
                        <input type="text" id="imageAlt" value="${img.alt || ''}" placeholder="Description for accessibility">
                    </div>
                `;
                break;
                
            case 'divider':
                const hr = element.querySelector('hr');
                html += `
                    <div class="form-group">
                        <label for="dividerColor">Color</label>
                        <input type="color" id="dividerColor" value="${this.rgbToHex(hr.style.backgroundColor) || '#e2e8f0'}">
                    </div>
                    <div class="form-group">
                        <label for="dividerHeight">Height (px)</label>
                        <input type="number" id="dividerHeight" value="${parseInt(hr.style.height) || 2}" min="1" max="10">
                    </div>
                `;
                break;
        }
        
        html += '<button type="submit" class="btn btn-primary">Apply Changes</button></form>';
        
        propertiesForm.innerHTML = html;
        
        // Add form submit handler
        document.getElementById('elementProperties').addEventListener('submit', (e) => {
            e.preventDefault();
            this.applyProperties(element);
        });
    }

    hideProperties() {
        const propertiesForm = document.getElementById('propertiesForm');
        propertiesForm.innerHTML = '<p class="no-selection">Select an element to edit its properties</p>';
    }

    applyProperties(element) {
        const elementType = this.getElementType(element);
        const form = document.getElementById('elementProperties');
        
        switch (elementType) {
            case 'text':
            case 'heading':
                const textContent = element.querySelector('p, h1, h2, h3, h4, h5, h6');
                textContent.textContent = form.textContent.value;
                textContent.style.fontSize = `${form.fontSize.value}px`;
                textContent.style.color = form.textColor.value;
                textContent.style.fontWeight = form.fontWeight.value;
                break;
                
            case 'button':
                const button = element.querySelector('button');
                button.textContent = form.buttonText.value;
                button.style.backgroundColor = form.buttonBgColor.value;
                button.style.color = form.buttonTextColor.value;
                button.style.padding = `${form.buttonPadding.value}px`;
                button.style.borderRadius = `${form.buttonBorderRadius.value}px`;
                break;
                
            case 'image':
                const img = element.querySelector('img');
                img.src = form.imageUrl.value;
                img.style.maxWidth = `${form.imageWidth.value}px`;
                img.alt = form.imageAlt.value;
                break;
                
            case 'divider':
                const hr = element.querySelector('hr');
                hr.style.backgroundColor = form.dividerColor.value;
                hr.style.height = `${form.dividerHeight.value}px`;
                break;
        }
    }

    getElementType(element) {
        if (element.querySelector('p')) return 'text';
        if (element.querySelector('h1, h2, h3, h4, h5, h6')) return 'heading';
        if (element.querySelector('button')) return 'button';
        if (element.querySelector('img')) return 'image';
        if (element.querySelector('hr')) return 'divider';
        return 'unknown';
    }

    rgbToHex(rgb) {
        if (!rgb) return null;
        if (rgb.startsWith('#')) return rgb;
        
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
        return null;
    }

    showPreview() {
        const modal = document.getElementById('previewModal');
        const previewContent = document.getElementById('previewContent');
        
        // Create a clean version of the canvas for preview
        const preview = this.canvas.cloneNode(true);
        preview.className = 'preview-canvas';
        preview.style.position = 'static';
        preview.style.border = 'none';
        preview.style.margin = '0';
        preview.style.padding = '20px';
        preview.style.minHeight = 'auto';
        
        // Remove canvas-specific classes and styles
        const elements = preview.querySelectorAll('.canvas-element');
        elements.forEach(el => {
            el.style.position = 'static';
            el.style.left = '';
            el.style.top = '';
            el.classList.remove('canvas-element', 'selected');
            el.style.border = 'none';
            el.style.boxShadow = 'none';
        });
        
        // Remove placeholder
        const placeholder = preview.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        previewContent.innerHTML = '';
        previewContent.appendChild(preview);
        modal.style.display = 'block';
    }

    hidePreview() {
        document.getElementById('previewModal').style.display = 'none';
    }

    exportHTML() {
        const html = this.generateHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'website.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateHTML() {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
        }
        button {
            cursor: pointer;
            font-family: inherit;
        }
        hr {
            border: none;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
`;

        // Clone canvas and clean up elements
        const canvasClone = this.canvas.cloneNode(true);
        const elements = canvasClone.querySelectorAll('.canvas-element');
        
        elements.forEach(el => {
            el.style.position = 'static';
            el.style.left = '';
            el.style.top = '';
            el.classList.remove('canvas-element', 'selected');
            el.style.border = 'none';
            el.style.boxShadow = 'none';
            el.style.minWidth = '';
            el.style.minHeight = '';
        });
        
        // Remove placeholder
        const placeholder = canvasClone.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        html += canvasClone.innerHTML;
        html += `
    </div>
</body>
</html>`;
        
        return html;
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear all elements?')) {
            this.elements.forEach(element => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
            this.elements = [];
            this.deselectElement();
            
            // Show placeholder
            const placeholder = this.canvas.querySelector('.canvas-placeholder');
            if (placeholder) {
                placeholder.style.display = 'block';
            }
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WebsiteBuilder();
}); 
