const varForm = `
  <h3>🥷烏衣行 詔安客語小辭典</h3>
  <div class="search">
    <div class="autocomplete">
      <button id="myWordOX" onclick="myWordOX()">⊕</button>
      <input 
        type="text" 
        class="mySearch" 
        id="AAA" 
        placeholder="${btnT}" 
        autofocus 
        onkeypress="if(event.keyCode == 13){Kasu('K'); myWordOX2();}">
		<span class="btn-group">
		  <button id="btnK" onclick="Kasu('K'); myWordOX2();">${btnK}</button>
		  <button id="btnG" onclick="Kasu('G'); myWordOX2();">${btnG}</button>
		</span>
    </div>
    <script>myWord();</script>
    <br />
    <div id="BBB"></div>
  </div>
`;

document.write(varForm);
