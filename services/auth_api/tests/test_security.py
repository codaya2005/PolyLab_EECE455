
import pytest
from services.auth_api.core.security import password_policy_ok, hash_password, verify_password

def test_password_policy():
    assert not password_policy_ok("short")
    assert not password_policy_ok("NoDigits!")
    assert not password_policy_ok("noupper1!")
    assert password_policy_ok("GoodPass1!")

def test_hash_verify():
    pw = "Complex1!"
    h = hash_password(pw)
    assert verify_password(pw, h)
