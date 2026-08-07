class BadResponse(object):

    def __init__(self, err_code: int, err_msg: str, err_msg_id: str):
        self.err_code = err_code
        self.err_msg = err_msg
        self.err_msg_id = err_msg_id
