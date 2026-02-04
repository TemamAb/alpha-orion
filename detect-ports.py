import socket
import random

def find_free_port(start_port=8000, end_port=9000):
    """Find a free port in the given range"""
    for port in range(start_port, end_port):
        if is_port_free(port):
            return port
    return None

def is_port_free(port):
    """Check if a port is free"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            return s.connect_ex(('localhost', port)) != 0
    except:
        return False

def get_random_free_port():
    """Get a random free port by binding to 0"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            s.listen(1)
            port = s.getsockname()[1]
            return port
    except:
        return None

if __name__ == "__main__":
    port = get_random_free_port()
    if port:
        print(f"Free port found: {port}")
    else:
        print("No free port found")
