// A viewport-bounded select menu, backed by the original form control.
const menus = new WeakMap();
let activeMenu = null;

document.addEventListener('pointerdown', event => {
    if (activeMenu && !activeMenu.trigger.contains(event.target) && !activeMenu.list.contains(event.target)) activeMenu.close();
});
document.addEventListener('focusin', event => {
    if (activeMenu && !activeMenu.trigger.contains(event.target) && !activeMenu.list.contains(event.target)) activeMenu.close();
});
window.addEventListener('resize', () => activeMenu?.position());
window.addEventListener('scroll', () => activeMenu?.position(), true);
window.visualViewport?.addEventListener('resize', () => activeMenu?.position());

export function enhanceSelect(select) {
    if (!select) return;
    if (menus.has(select)) { menus.get(select).refresh(); return; }
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const label = select.getAttribute('aria-label') || select.labels?.[0]?.textContent.trim() || 'اختر';
    trigger.setAttribute('aria-label', label);
    const list = document.createElement('div');
    list.className = 'select-menu';
    list.id = select.id + '-options';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', label);
    list.dir = 'rtl';
    list.hidden = true;
    trigger.setAttribute('aria-controls', list.id);
    select.hidden = true;
    select.after(trigger);
    document.body.append(list);
    let options = [];
    let highlighted = 0;
    let typed = '';
    let typedAt = 0;
    const menu = {
        trigger, list,
        close() {
            list.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            trigger.removeAttribute('aria-activedescendant');
            if (activeMenu === menu) activeMenu = null;
        },
        position() {
            const rect = trigger.getBoundingClientRect();
            const viewport = window.visualViewport;
            const top = viewport?.offsetTop || 0;
            const height = viewport?.height || window.innerHeight;
            const width = viewport?.width || document.documentElement.clientWidth;
            if (rect.bottom < top || rect.top > top + height) { menu.close(); return; }
            const below = top + height - rect.bottom - 14;
            const above = rect.top - top - 14;
            const upwards = below < 220 && above > below;
            list.style.width = Math.min(rect.width, width - 16) + 'px';
            list.style.left = Math.max(8, Math.min(rect.left, width - rect.width - 8)) + 'px';
            list.style.maxHeight = Math.max(0, Math.min(280, upwards ? above : below)) + 'px';
            list.style.top = (upwards ? rect.top - list.getBoundingClientRect().height - 6 : rect.bottom + 6) + 'px';
        },
        refresh() {
            menu.close();
            options = [...select.options].filter(option => !option.disabled);
            trigger.disabled = select.disabled || !options.length;
            trigger.textContent = select.selectedOptions[0]?.textContent || 'اختر';
            list.replaceChildren(...options.map((option, index) => {
                const item = document.createElement('div');
                item.className = 'select-menu-option';
                item.id = list.id + '-' + index;
                item.setAttribute('role', 'option');
                item.setAttribute('aria-selected', String(option.value === select.value));
                item.textContent = option.textContent;
                item.addEventListener('click', () => choose(index));
                return item;
            }));
        }
    };
    function highlight(index) {
        highlighted = Math.max(0, Math.min(options.length - 1, index));
        [...list.children].forEach((item, i) => item.classList.toggle('highlighted', i === highlighted));
        const item = list.children[highlighted];
        if (item) {
            trigger.setAttribute('aria-activedescendant', item.id);
            item.scrollIntoView({ block: 'nearest' });
        }
    }
    function open() {
        activeMenu?.close();
        activeMenu = menu;
        list.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        menu.position();
        highlight(options.findIndex(option => option.value === select.value));
    }
    function choose(index) {
        if (!options[index]) return;
        select.value = options[index].value;
        menu.refresh();
        select.dispatchEvent(new Event('change', { bubbles: true }));
        trigger.focus({ preventScroll: true });
    }
    trigger.addEventListener('click', () => activeMenu === menu ? menu.close() : open());
    list.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') event.preventDefault(); });
    trigger.addEventListener('keydown', event => {
        const isOpen = activeMenu === menu;
        if (event.key === 'Tab') { menu.close(); return; }
        if (event.key === 'Escape') { event.preventDefault(); menu.close(); return; }
        if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
            event.preventDefault();
            if (!isOpen) { open(); if (event.key !== 'Home' && event.key !== 'End') return; }
            if (event.key === 'ArrowDown') highlight(highlighted + 1);
            else if (event.key === 'ArrowUp') highlight(highlighted - 1);
            else if (event.key === 'Home') highlight(0);
            else if (event.key === 'End') highlight(options.length - 1);
            else if (isOpen) choose(highlighted);
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            if (!isOpen) open();
            typed = Date.now() - typedAt > 700 ? event.key : typed + event.key;
            typedAt = Date.now();
            const match = options.findIndex(option => option.textContent.startsWith(typed));
            if (match >= 0) highlight(match);
        }
    });
    select.addEventListener('change', () => menu.refresh());
    menus.set(select, menu);
    menu.refresh();
}
