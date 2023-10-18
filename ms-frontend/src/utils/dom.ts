
export const openSmallWindow = (url?: string | URL) => {

  var newWindow = window.open(
    url, 
    'window', 
    'toolbar=no,location=no,menubar=no,resizable=yes'
  );

  if (!newWindow || newWindow.closed) {
    alert('Please allow popup window！');
  } else {
    return;
  }

}