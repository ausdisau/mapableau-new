(function(){
  var parts = self.__MAPABLE_APP_PARTS || [];
  if (!parts.length) { console.error('MapAble app parts missing'); return; }
  var bin = '';
  for (var i=0;i<parts.length;i++){
    var s = atob(parts[i]);
    for (var j=0;j<s.length;j++) bin += s.charAt(j);
  }
  // Convert binary string to JS source (utf-8)
  var bytes = new Uint8Array(bin.length);
  for (var k=0;k<bin.length;k++) bytes[k]=bin.charCodeAt(k);
  var src = new TextDecoder('utf-8').decode(bytes);
  (0,eval)(src);
})();
