const menuIcon = document.querySelector('#menu-icon');
const menuTab = document.querySelector('#menu-tab');
const menuContainer = document.querySelector('#menu-container');
const menuItems = document.querySelector('#menu-items');
const body = document.querySelector('body');

body.onload = ()=>{
    body.classList.remove('preload');
}

menuIcon.addEventListener('click',()=>{
    [menuIcon,
     menuTab,
     menuContainer,
     menuItems,].map(x=>x.classList.toggle('expanded'));
})