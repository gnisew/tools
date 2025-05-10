let arrList = [];


let biaodian = `，;Ctrl ，
。;Ctrl .
？;Ctrl Shift ？
；;Ctrl ；
：;Ctrl Shift：
、;Ctrl \
！;Ctrl Shift 1
「;Ctrl [
」;Ctrl ]
「」;Ctrl [ ]`;

let css1 = `link
rel=
"stylesheet"
href=
"mystyle.css">
style=""
/*comment*/
color
background
background-color
background-image
url("paper.gif")
background-repeat
no-repeat
repeat-x
repeat-y
background-position
background-attachment
fixed
scroll
local
inherit
opacity
background-size
cover`;

let css2 = `border-width
border-style
solid
dotted
none
border-color
border-top-style
border-left
border-radius
margin-top
margin-right
margin-bottom
margin-left
width:300px
margin:auto
padding-top
padding-right
padding-bottom
padding-left
height
width
max-width
min-width`;

let css3 = `outline-style
outline-color
outline-width
outline-offset
text-align
text-align-last
center
justify
vertical-align
baseline
text-top
text-bottom
bottom
sub
super
text-decoration
none
text-decoration-line
overline
line-through
underline`;

let css4 = `text-decoration-color
text-decoration-style
wavy
dashed
text-transform
uppercase
lowercase
capitalize
text-indent
letter-spacing
line-height
font:12px/30px
word-spacing
white-space
nowrap
text-shadow`;

let css5 = `font-family
serif
sans-serif
monospace
cursive
fantasy
font-style
normal
italic
font-weight
bold
font-variant
small-caps
font-size
1em
16px
fonts.googleapis.com/
css?family=Sofia
fonts.googleapis.com/
icon?family=
Material+Icons`;

let css6 = `a:link
a:visited
a:hover
a:active
cursor
default
pointer
help
list-style
list-style-type
none
circle
square
upper-roman
lower-alpha
list-style-image
list-style-position
outside
inside`;

let css7 = `border-collapse
collapse
width:100%
nth-child(even)
nth-child(odd)
display
inline
block
inline-block
none
visibility
hidden
position
relative
absolute
static
sticky
-webkit-sticky`;

let css8 = `z-index
overflow
overflow-x
overflow-y
visible
hidden
scroll
auto
float
left
right
.clearfix::after
content:""
clear:both
display:table
box-sizing
border-box
transform
translate(-50%,-50%)`;




//========================================;
let arrList00 = [[biaodian, "#選題目挑戰"], 
[biaodian, "#標點符號"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;

let cssArr = [[css1, "#css1"], 
[css2, "#css2"],
[css3, "#css3"], 
[css4, "#css4"], 
[css5, "#css5"], 
[css6, "#css6"], 
[css7, "#css7"]];
// 陣列清單; 預設亂數，不亂數則名稱前加#，如 [biaodian, "#標點符號"], ;
arrList = arrList00.concat(cssArr);

