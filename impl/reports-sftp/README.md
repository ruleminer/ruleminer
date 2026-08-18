# REPORTS SFTP SERVER

A simple SFTP server used for storing report files and serving them to other
services. The local container generates its own host keys. Its username and
password are configured in `.env.local`.

## Directory Structure and Chroot

The SFTP server uses SSH chroot to isolate users. The directory structure is set up as follows:
- `/home/{username}` - Chroot directory (owned by root, permissions 755)
- `/home/{username}/reports` - Reports directory where files are stored (owned by user, permissions 755)

The Docker volume `./reports` is mounted to `/home/{username}/reports` to ensure proper chroot functionality.

The Dockerfile automatically creates the directory structure with correct ownership and permissions during image build to fix the "bad ownership or modes for chroot directory" error.
