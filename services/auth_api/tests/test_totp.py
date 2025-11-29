
import pyotp
from services.auth_api.utils.totp import create_totp_secret, verify_totp

def test_totp_roundtrip():
    secret = create_totp_secret()
    code = pyotp.TOTP(secret).now()
    assert verify_totp(secret, code)
