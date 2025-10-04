        document.addEventListener('DOMContentLoaded', () => {
			checkAndLoadMaterialIcons();
            WebIME.init({
                defaultMode: 'sixian',
                candidatesPerPage: 5,
                longPhrase: false,
                maxCompositionLength: 30
            });
        });