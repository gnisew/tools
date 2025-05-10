var myVar=`
<BODY OnLoad="BodyOnLoad();">
  <center>
        <TABLE OnFocus="IME.InputArea.focus()" bgcolor="#EEE" WIDTH="60%">
          <FORM>
            <TBODY>
              <TR>
                <TH ROWSPAN="2" valign="top">
                  <!-- 輸出出文字的文字框 -->
                  <TEXTAREA OnKeyDown="return ImeKeyDown(event)" OnKeyPress="return ImeKeyPress(event)" OnKeyUp="return ImeKeyUp(event)" Rows="11" Cols="40" style="FONT-SIZE:18pt;" ID="InputArea"></TEXTAREA>
                </TH>
                <TH>
                  <!-- 英文編碼 -->
                  <INPUT OnFocus="IME.InputArea.focus();" Name="Comp" ID="Comp" Size="19" style="FONT-SIZE: 14pt;" >
                </TH>
              </TR>
              <TR>
                <TH valign="top">
                  <!-- 中文字串的文字框 -->
                  <TEXTAREA OnFocus="IME.InputArea.focus();" Name="Cand" ID="Cand" Rows="11" Cols="18" style="FONT-SIZE: 16pt;"></TEXTAREA>
                </TH>
              </TR>
          </FORM>
          <tr>
          <td>
          <INPUT name="EnglishMode" ID="EnglishMode" type="checkbox" OnFocus="IME.InputArea.focus()">英文(Ctrl)
          <INPUT name="AutoUp" ID="AutoUp" type="checkbox" OnFocus="IME.InputArea.focus()">自動上字
          　翻頁 PageUp/PageDown；<br />電腦切換到英數；聲調用字母 ˊz ˇv ˋs ˆx ⁺f ˈl
          </td>
          <td align=center>
          </td>
          </tr>		  
        </TABLE>
      </td>
    </tr>
    </TBODY>
  </table>  
  </center>
  </body>
  `;
  
document.write(myVar);