export class Visualisation3DTextHandler {
  /*
        Combine the text for overlapping points because it only displayed the text from the last overlapping point
    */
  public static combineTextForOverlappingPoints(text: any, id1: any, id2: any) {
    for (let i = 0; i < id1.length; i++) {
      let combinedText = '';
      for (let j = 0; j < id1[i].length; j++) {
        if (id2.includes(id1[i][j])) {
          var index = id2.indexOf(id1[i][j]);
          combinedText += text[index] + '<br>';
        }
      }
      //delete last <br> tag
      text[index] = combinedText.slice(0, -4);
    }
    return text;
  }

  public static insertLineBreaks(text: string, width: number): string {
    if (typeof text === 'string') {
      if (text.length > width) {
        let p = width;
        //find index of the last space before the width limit or before ( or < if they appear in 8-character range
        do {
          const substringToCheck = text.substring(p - 8, p); //extract the 8-character range
          // if the substring contains ( or <, break at that position
          if (substringToCheck.includes('(') || substringToCheck.includes('<')) {
            const breakPosition = p - 8 + substringToCheck.indexOf('(') + substringToCheck.indexOf('<');
            p = breakPosition;
            break;
          }
          p--;
        } while (p > 0 && text[p] != ' ');
        /*
                    insert a line break 
                */
        if (p > 0) {
          let left = text.substring(0, p);
          let right;

          /*
                        <br> in text indicates the end of the rule's text
                    */
          if (left.includes('<br>')) {
            right = text.substring(left.lastIndexOf('<br>') + 4);
            left = left.substring(0, left.lastIndexOf('<br>' + 4));
            return left + this.insertLineBreaks(right, width);
          } else {
            right = text.substring(p + 1);
            return left + '<br>' + this.insertLineBreaks(right, width);
          }
        }
      }
    }
    return text;
  }

  /*
        Text intend and bolding the keywords
    */
  public static formatText(text: string): string {
    //text intend for the rule text with line breaks
    if (text.includes('<br>')) {
      text = text.replace(/IF/g, '   IF');
    }
    //bold the "IF" and "THEN" keywords
    text = text.replace(/IF/g, '<b>IF</b>');
    text = text.replace(/THEN/g, '<b>THEN</b>');
    return text;
  }
}
