document.addEventListener('DOMContentLoaded', function(){
    const menuBtn = document.getElementById('menu-btn')
    const sidebar = document.querySelector('.sidebar')

    if(menuBtn){
        menuBtn.addEventListener('click', function() {
                sidebar.classList.toggle('collapsed')
               
            })
    }

})