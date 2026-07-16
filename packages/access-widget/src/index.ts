/**
 * Embeddable widget helpers — always pair with an accessible list alternative.
 */

export function widgetScriptSnippet(input: {
  accessPlaceId: string;
  originAllowlist: string[];
}): string {
  const origins = input.originAllowlist.map((o) => JSON.stringify(o)).join(",");
  return `<!-- MapAble Access Widget: provide a list alternative for screen-reader users -->
<div id="mapable-access-widget" data-place="${input.accessPlaceId}"></div>
<ul id="mapable-access-widget-list" aria-label="Access summary list alternative"></ul>
<script>
(function(){
  var allowed=[${origins}];
  if(allowed.length && allowed.indexOf(location.origin)<0){return;}
  fetch(${JSON.stringify("/api/access-intelligence/widget/summary?accessPlaceId=" + input.accessPlaceId)})
    .then(function(r){return r.json();})
    .then(function(data){
      var list=document.getElementById('mapable-access-widget-list');
      (data.payload.listAlternative||[]).forEach(function(item){
        var li=document.createElement('li');
        li.textContent=item.label;
        list.appendChild(li);
      });
    });
})();
</script>`;
}
