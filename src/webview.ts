import 'semantic-ui-css/semantic.min.css'
import App from './web';
import { createRoot } from 'react-dom/client';

declare const document: any;

document.addEventListener("DOMContentLoaded", function () {
    // Code here waits to run until the DOM is loaded.
    const root = createRoot(document.getElementById('app'));
    root.render(App());
});
