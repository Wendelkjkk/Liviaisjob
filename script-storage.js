document.addEventListener('DOMContentLoaded', function() {
    // Elementos da UI
    const storageGrid = document.getElementById('storageGrid');
    const createFolderBtn = document.getElementById('createFolderBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const folderModal = document.getElementById('folderModal');
    const folderNameInput = document.getElementById('folderName');
    const confirmFolderBtn = document.getElementById('confirmFolderBtn');
    const cancelFolderBtn = document.getElementById('cancelFolderBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const breadcrumbs = document.getElementById('breadcrumbs');
    const toast = document.getElementById('toast');

    // Estado da aplicação
    let currentPath = [];
    let folders = {};
    let files = {};

    // Inicialização
    initStorage();

    // Event Listeners
    createFolderBtn.addEventListener('click', showFolderModal);
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    confirmFolderBtn.addEventListener('click', createFolder);
    cancelFolderBtn.addEventListener('click', hideFolderModal);
    logoutBtn.addEventListener('click', logout);

    // Funções

    function initStorage() {
        // Carrega dados do localStorage ou inicializa
        const savedFolders = localStorage.getItem('pixelVaultFolders');
        const savedFiles = localStorage.getItem('pixelVaultFiles');

        if (savedFolders) {
            folders = JSON.parse(savedFolders);
        } else {
            // Estrutura inicial de pastas
            folders = {
                '': {
                    name: 'Home',
                    path: '',
                    children: []
                }
            };
            saveFolders();
        }

        files = savedFiles ? JSON.parse(savedFiles) : {};
        
        renderBreadcrumbs();
        renderStorageItems();
    }

    function showFolderModal() {
        folderModal.classList.add('active');
        folderNameInput.focus();
    }

    function hideFolderModal() {
        folderModal.classList.remove('active');
        folderNameInput.value = '';
    }

    function createFolder() {
        const folderName = folderNameInput.value.trim();
        
        if (!folderName) {
            showToast('Digite um nome para a pasta');
            return;
        }

        const currentPathStr = getCurrentPathString();
        const folderPath = currentPathStr ? `${currentPathStr}/${folderName}` : folderName;
        const folderId = generateId();

        // Verifica se já existe pasta com esse nome
        if (folders[folderPath]) {
            showToast('Já existe uma pasta com esse nome');
            return;
        }

        // Cria nova pasta
        folders[folderPath] = {
            id: folderId,
            name: folderName,
            path: folderPath,
            parent: currentPathStr || null,
            children: []
        };

        // Adiciona à pasta pai
        if (currentPathStr) {
            folders[currentPathStr].children.push({
                type: 'folder',
                id: folderId,
                name: folderName,
                path: folderPath
            });
        } else {
            folders[''].children.push({
                type: 'folder',
                id: folderId,
                name: folderName,
                path: folderPath
            });
        }

        saveFolders();
        hideFolderModal();
        renderStorageItems();
        showToast('Pasta criada com sucesso');
    }

    function handleFileUpload(e) {
        const uploadedFiles = e.target.files;
        if (uploadedFiles.length === 0) return;

        const currentPathStr = getCurrentPathString();
        
        Array.from(uploadedFiles).forEach(file => {
            if (!file.type.startsWith('image/')) {
                showToast('Apenas arquivos de imagem são permitidos');
                return;
            }

            const fileId = generateId();
            const fileName = file.name;
            const filePath = currentPathStr ? `${currentPathStr}/${fileName}` : fileName;
            const fileURL = URL.createObjectURL(file);

            // Adiciona ao armazenamento de arquivos
            files[fileId] = {
                id: fileId,
                name: fileName,
                path: filePath,
                parent: currentPathStr || null,
                url: fileURL,
                uploadedAt: new Date().toISOString()
            };

            // Adiciona à pasta pai
            if (currentPathStr) {
                folders[currentPathStr].children.push({
                    type: 'file',
                    id: fileId,
                    name: fileName,
                    path: filePath
                });
            } else {
                folders[''].children.push({
                    type: 'file',
                    id: fileId,
                    name: fileName,
                    path: filePath
                });
            }
        });

        saveFiles();
        saveFolders();
        renderStorageItems();
        showToast(`${uploadedFiles.length} arquivo(s) enviado(s)`);
        fileInput.value = ''; // Limpa o input
    }

    function renderStorageItems() {
        storageGrid.innerHTML = '';
        const currentPathStr = getCurrentPathString();
        const currentFolder = folders[currentPathStr] || folders[''];
        
        if (!currentFolder.children.length) {
            storageGrid.innerHTML = `
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--borda)" stroke-width="1.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <p>Esta pasta está vazia</p>
                </div>
            `;
            return;
        }

        currentFolder.children.forEach(item => {
            if (item.type === 'folder') {
                const folderElement = document.createElement('div');
                folderElement.className = 'storage-item item-folder';
                folderElement.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>${item.name}</span>
                `;
                folderElement.addEventListener('click', () => navigateToFolder(item.path));
                storageGrid.appendChild(folderElement);
            } else if (item.type === 'file') {
                const file = files[item.id];
                if (!file) return;

                const fileElement = document.createElement('div');
                fileElement.className = 'storage-item item-image';
                fileElement.innerHTML = `
                    <img src="${file.url}" alt="${file.name}">
                    <div class="item-image-overlay">
                        <small>${file.name}</small>
                    </div>
                `;
                fileElement.addEventListener('click', () => viewImage(file));
                storageGrid.appendChild(fileElement);
            }
        });
    }

    function navigateToFolder(path) {
        currentPath = path ? path.split('/') : [];
        renderBreadcrumbs();
        renderStorageItems();
    }

    function renderBreadcrumbs() {
        breadcrumbs.innerHTML = '';
        
        // Link para Home
        const homeLink = document.createElement('a');
        homeLink.className = 'nav-home';
        homeLink.textContent = 'Home';
        homeLink.href = '#';
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToFolder('');
        });
        breadcrumbs.appendChild(homeLink);

        // Links para pastas pai
        let currentPathStr = '';
        currentPath.forEach((folder, index) => {
            currentPathStr = currentPathStr ? `${currentPathStr}/${folder}` : folder;
            
            const separator = document.createElement('span');
            separator.textContent = '/';
            separator.style.margin = '0 0.5rem';
            separator.style.color = 'var(--borda)';
            breadcrumbs.appendChild(separator);

            const folderLink = document.createElement('a');
            folderLink.href = '#';
            folderLink.textContent = folder;
            folderLink.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToFolder(currentPathStr);
            });
            breadcrumbs.appendChild(folderLink);
        });
    }

    function viewImage(file) {
        // Implementar visualização da imagem em tela cheia
        console.log('Visualizando imagem:', file.name);
        // Aqui você pode implementar um modal de visualização
        showToast(`Visualizando: ${file.name}`);
    }

    function logout() {
        // Limpa o localStorage se necessário
        // localStorage.removeItem('pixelVaultToken');
        window.location.href = 'index.html';
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function saveFolders() {
        localStorage.setItem('pixelVaultFolders', JSON.stringify(folders));
    }

    function saveFiles() {
        localStorage.setItem('pixelVaultFiles', JSON.stringify(files));
    }

    function getCurrentPathString() {
        return currentPath.join('/');
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // GitHub Token Integration (simplificado)
    function authenticateWithGitHub() {
        // Implementação real precisaria da API do GitHub
        console.log('Autenticando com GitHub...');
        // Retorna um token simulado para demonstração
        return Promise.resolve('github_pat_1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz');
    }

    // Verifica autenticação ao carregar
    async function checkAuth() {
        const token = localStorage.getItem('pixelVaultToken');
        if (!token) {
            try {
                const newToken = await authenticateWithGitHub();
                localStorage.setItem('pixelVaultToken', newToken);
                showToast('Autenticado com GitHub');
            } catch (error) {
                console.error('Falha na autenticação:', error);
                showToast('Erro na autenticação com GitHub');
            }
        }
    }

    // Inicia verificação de autenticação
    checkAuth();
});