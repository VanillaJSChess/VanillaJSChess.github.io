const menuIcon = document.querySelector('#menu-icon');
const menuTab = document.querySelector('#menu-tab');
const menuContainer = document.querySelector('#menu-container');
const menuItems = document.querySelector('#menu-items');
const body = document.querySelector('body');

menuIcon.addEventListener('click',toggleSidebar);

function toggleSidebar(){
    [menuIcon,
     menuTab,
     menuContainer,
     menuItems,].map(x=>x.classList.toggle('expanded'));
}

function hideSidebar(){
    [menuIcon,
     menuTab,
     menuContainer,
     menuItems,].map(x=>x.classList.remove('expanded'));
}

function resizeMenu(){
  if ((window.innerWidth - mainContainer.offsetWidth) < menuTab.offsetWidth*2){
    menuTab.classList.add('fullscreen');
  } else {
    menuTab.classList.remove('fullscreen');
  }
}