if (typeof window !== 'undefined') {
  window.onload = function () {
    setTimeout(function () {
      document.querySelector('.preloader').style.display = 'none';
    }, 1500);
  };
}
