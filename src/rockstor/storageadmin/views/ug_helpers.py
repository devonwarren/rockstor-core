"""
Copyright (c) 2012-2014 RockStor, Inc. <http://rockstor.com>
This file is part of RockStor.

RockStor is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published
by the Free Software Foundation; either version 2 of the License,
or (at your option) any later version.

RockStor is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
"""

from storageadmin.models import (User, Group)
from system.users import (get_users, get_groups)

import logging
logger = logging.getLogger(__name__)


def combined_users():
    users = []
    sys_users = get_users(min_uid=0)
    uname_list = sys_users.keys()
    for u in uname_list:
        try:
            uo = User.objects.get(username=u)
            uo.uid = sys_users[u][0]
            uo.gid = sys_users[u][1]
            gname = get_groups(uo.gid).keys()[0]
            create = True
            if (uo.group is not None):
                if (uo.group.gid == uo.gid or uo.group.groupname == gname):
                    uo.group.groupname = gname
                    uo.group.gid = uo.gid
                    uo.group.save()
                    create = False
            if (create):
                try:
                    go = Group.objects.get(groupname=gname)
                    go.gid = uo.gid
                    go.save()
                    uo.group = go
                except Group.DoesNotExist:
                    try:
                        go = Group.objects.get(gid=uo.gid)
                        go.groupname = gname
                        go.save()
                        uo.group = go
                    except Group.DoesNotExist:
                        go = Group(groupname=gname, gid=uo.gid)
                        go.save()
                        uo.group = go
            uo.save()
            users.append(uo)
        except User.DoesNotExist:
            users.append(User(username=u, uid=sys_users[u][0],
                              gid=sys_users[u][1], admin=False))
    for u in User.objects.all():
        if (u.username not in uname_list):
            users.append(u)
    return users


def combined_groups():
    groups = []
    sys_groups = get_groups()
    gname_list = sys_groups.keys()
    for g in gname_list:
        try:
            go = Group.objects.get(groupname=g)
            go.gid = sys_groups[g]
            go.save()
            groups.append(go)
        except Group.DoesNotExist:
            groups.append(Group(groupname=g, gid=sys_groups[g]))
    for g in Group.objects.all():
        if (g.groupname not in gname_list):
            groups.append(g)
    return groups
