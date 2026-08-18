<#macro emailLayout>
<!DOCTYPE html>
<html lang="pl">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
        <title>RuleMiner</title>

        <style type="text/css">
            body {
                margin: 25px 0 0 0; 
                padding: 0; 
                min-width: 100%;
                background-color: #eeeeee;
                font-family: Helvetica, Arial, sans-serif;
            }

            a {
                color: #2196F3;
                text-decoration: none;
            }

            a:hover {
                color: #0a6ebd;
                text-decoration: underline;
                cursor: pointer;
            }
        </style>
    </head>
    <body style="margin: 25px 0 0 0; padding: 0; min-width: 100%; background-color: #eeeeee; font-family: Helvetica, Arial, sans-serif">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td>
                    <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px">
                        <tr>
                                                      <td class="header" style="
                            background:linear-gradient(21deg, rgb(19, 33, 64) 20%, rgb(204, 83, 51) 100%);
                            background-repeat: no-repeat;
                            background-size: cover;
                            border: 1px solid #435272;
                            color: #ffffff;
                            text-align: center;
                            font-size: 32px;
                            font-weight: 300;
                            height: 72px;
                            ">
                            RuleMiner
                            </td>
                        </tr>
                        <tr>
                            <td class="body" style="padding: 20px; background-color: #ffffff; color: #666666; font-size: 13px; text-align: left; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; border-right: 1px solid #dddddd;">
                                <#nested>                               
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
</#macro>
