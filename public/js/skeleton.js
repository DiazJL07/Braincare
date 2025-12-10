// Simple skeleton remover on load for images and iframes
(function(){
  function removeSkeleton(el){
    if (!el) return;
    el.classList.remove('skeleton');
    el.classList.add('hide-skeleton');
  }

  function setupImageSkeleton(){
    var imgs = document.querySelectorAll('img.skeleton');
    imgs.forEach(function(img){
      if (img.complete && img.naturalWidth > 0) {
        removeSkeleton(img);
      } else {
        img.addEventListener('load', function(){ removeSkeleton(img); });
        img.addEventListener('error', function(){ removeSkeleton(img); });
      }
    });
  }

  function setupIframeSkeleton(){
    var iframes = document.querySelectorAll('iframe.skeleton');
    iframes.forEach(function(frame){
      frame.addEventListener('load', function(){ removeSkeleton(frame); });
      frame.addEventListener('error', function(){ removeSkeleton(frame); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      setupImageSkeleton();
      setupIframeSkeleton();
    });
  } else {
    setupImageSkeleton();
    setupIframeSkeleton();
  }
})();
