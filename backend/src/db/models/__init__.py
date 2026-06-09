# Import all models here so that Base.metadata is always complete.
# This is used by Alembic autogenerate.

from .user import User  # noqa: F401
from .project import Project  # noqa: F401
from .message import Message  # noqa: F401
from .cv import CV  # noqa: F401
from .access_log import AccessLog  # noqa: F401
from .app_setting import AppSetting  # noqa: F401
